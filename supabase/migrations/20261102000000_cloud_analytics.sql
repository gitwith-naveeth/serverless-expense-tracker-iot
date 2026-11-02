-- Cloud analytics functions. All aggregation is performed in PostgreSQL and
-- the caller must provide an authenticated user's id.

CREATE INDEX IF NOT EXISTS idx_transactions_user_timestamp
  ON public.transactions(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_source_timestamp
  ON public.transactions(user_id, source, timestamp DESC);

CREATE OR REPLACE FUNCTION public.get_expense_analytics(
  p_user_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH filtered AS (
  SELECT *
  FROM public.transactions
  WHERE user_id = p_user_id
    AND timestamp >= p_start_date
    AND timestamp < p_end_date
),
expense_rows AS (
  SELECT *
  FROM filtered
  WHERE transaction_type = 'expense'
),
summary AS (
  SELECT
    COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'expense'), 0) AS total_expenses,
    COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'income'), 0) AS total_income,
    COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'expense' AND expense_classification = 'essential'), 0) AS essential_expenses,
    COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'expense' AND expense_classification = 'non-essential'), 0) AS non_essential_expenses,
    COUNT(*) FILTER (WHERE transaction_type = 'expense') AS expense_count
  FROM filtered
),
daily AS (
  SELECT
    (timestamp AT TIME ZONE 'UTC')::date AS day,
    SUM(amount) AS amount,
    COUNT(*)::INTEGER AS transaction_count
  FROM expense_rows
  GROUP BY 1
),
categories AS (
  SELECT
    category,
    SUM(amount) AS amount,
    COUNT(*)::INTEGER AS transaction_count
  FROM expense_rows
  GROUP BY category
),
monthly AS (
  SELECT
    TO_CHAR(date_trunc('month', timestamp AT TIME ZONE 'UTC'), 'YYYY-MM') AS month,
    COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'expense'), 0) AS expenses,
    COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'income'), 0) AS income
  FROM filtered
  GROUP BY 1
  ORDER BY 1
),
sources AS (
  SELECT
    source,
    COUNT(*)::INTEGER AS transaction_count,
    COALESCE(SUM(amount), 0) AS amount
  FROM expense_rows
  GROUP BY source
),
hardware_devices AS (
  SELECT
    d.device_id,
    d.device_name,
    d.status,
    d.last_seen,
    COUNT(t.id)::INTEGER AS transaction_count,
    COALESCE(SUM(t.amount), 0) AS amount
  FROM public.hardware_devices d
  LEFT JOIN filtered t
    ON t.device_id = d.id
   AND t.source = 'hardware'
   AND t.transaction_type = 'expense'
  WHERE d.user_id = p_user_id
  GROUP BY d.id, d.device_id, d.device_name, d.status, d.last_seen
),
budget AS (
  SELECT
    COALESCE(SUM(total_budget_amount), 0) AS total_allocated,
    COALESCE(SUM(essential_budget), 0) AS essential_allocated,
    COALESCE(SUM(non_essential_budget), 0) AS non_essential_allocated
  FROM public.budgets
  WHERE user_id = p_user_id
    AND month >= TO_CHAR(p_start_date AT TIME ZONE 'UTC', 'YYYY-MM')
    AND month <= TO_CHAR(p_end_date AT TIME ZONE 'UTC', 'YYYY-MM')
),
budget_usage AS (
  SELECT
    COALESCE(SUM(amount) FILTER (WHERE expense_classification = 'essential'), 0) AS essential_spent,
    COALESCE(SUM(amount) FILTER (WHERE expense_classification = 'non-essential'), 0) AS non_essential_spent
  FROM expense_rows
)
SELECT jsonb_build_object(
  'range', jsonb_build_object(
    'start', p_start_date,
    'end', p_end_date
  ),
  'summary', (
    SELECT jsonb_build_object(
      'totalExpenses', total_expenses,
      'totalIncome', total_income,
      'netSavings', total_income - total_expenses,
      'expenseCount', expense_count,
      'averageDailySpending', CASE
        WHEN GREATEST(EXTRACT(EPOCH FROM (p_end_date - p_start_date)) / 86400, 1) > 0
        THEN total_expenses / GREATEST(EXTRACT(EPOCH FROM (p_end_date - p_start_date)) / 86400, 1)
        ELSE 0
      END,
      'incomeToExpenseRatio', CASE WHEN total_expenses > 0 THEN total_income / total_expenses ELSE NULL END,
      'savingsPercentage', CASE WHEN total_income > 0 THEN ((total_income - total_expenses) / total_income) * 100 ELSE NULL END,
      'essentialExpenses', essential_expenses,
      'nonEssentialExpenses', non_essential_expenses,
      'essentialPercentage', CASE WHEN total_expenses > 0 THEN (essential_expenses / total_expenses) * 100 ELSE 0 END,
      'nonEssentialPercentage', CASE WHEN total_expenses > 0 THEN (non_essential_expenses / total_expenses) * 100 ELSE 0 END
    )
    FROM summary
  ),
  'daily', COALESCE((SELECT jsonb_agg(jsonb_build_object('date', day, 'amount', amount, 'transactionCount', transaction_count) ORDER BY day) FROM daily), '[]'::jsonb),
  'categories', COALESCE((SELECT jsonb_agg(jsonb_build_object(
    'name', category,
    'amount', amount,
    'transactionCount', transaction_count,
    'percentage', CASE WHEN (SELECT total_expenses FROM summary) > 0 THEN (amount / (SELECT total_expenses FROM summary)) * 100 ELSE 0 END
  ) ORDER BY amount DESC) FROM categories), '[]'::jsonb),
  'monthly', COALESCE((SELECT jsonb_agg(jsonb_build_object(
    'month', month,
    'expenses', expenses,
    'income', income,
    'savings', income - expenses
  ) ORDER BY month) FROM monthly), '[]'::jsonb),
  'sources', COALESCE((SELECT jsonb_object_agg(source, jsonb_build_object('transactionCount', transaction_count, 'amount', amount)) FROM sources), '{}'::jsonb),

  'budget', (
    SELECT jsonb_build_object(
      'totalAllocated', budget.total_allocated,
      'essentialAllocated', budget.essential_allocated,
      'nonEssentialAllocated', budget.non_essential_allocated,
      'totalSpent', (SELECT total_expenses FROM summary),
      'essentialSpent', budget_usage.essential_spent,
      'nonEssentialSpent', budget_usage.non_essential_spent,
      'remaining', budget.total_allocated - (SELECT total_expenses FROM summary),
      'utilizationPercentage', CASE
        WHEN budget.total_allocated > 0 THEN
          ((SELECT total_expenses FROM summary) / budget.total_allocated) * 100
        ELSE 0
      END
    )
    FROM budget, budget_usage
  ),

  'hardware', jsonb_build_object(
    'totalExpenses', COALESCE((SELECT (sources.amount) FROM sources WHERE source = 'hardware'), 0),
    'transactionCount', COALESCE((SELECT sources.transaction_count FROM sources WHERE source = 'hardware'), 0),
    'essentialExpenses', (SELECT COALESCE(SUM(amount), 0) FROM expense_rows WHERE source = 'hardware' AND expense_classification = 'essential'),
    'nonEssentialExpenses', (SELECT COALESCE(SUM(amount), 0) FROM expense_rows WHERE source = 'hardware' AND expense_classification = 'non-essential'),
    'devices', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'deviceId', device_id,
      'deviceName', device_name,
      'status', status,
      'lastSeen', last_seen,
      'transactionCount', transaction_count,
      'amount', amount
    ) ORDER BY device_name) FROM hardware_devices), '[]'::jsonb)
  )
);
$$;

REVOKE ALL ON FUNCTION public.get_expense_analytics(UUID, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_expense_analytics(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;
