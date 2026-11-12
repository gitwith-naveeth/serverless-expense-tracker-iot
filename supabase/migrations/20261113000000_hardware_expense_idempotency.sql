-- Durable, device-scoped idempotency for hardware expense requests.
CREATE TABLE IF NOT EXISTS public.hardware_expense_idempotency (
    device_id UUID NOT NULL REFERENCES public.hardware_devices(id) ON DELETE CASCADE,
    request_id TEXT NOT NULL,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (device_id, request_id)
);

CREATE OR REPLACE FUNCTION public.record_hardware_expense(
    p_device_id UUID,
    p_user_id UUID,
    p_request_id TEXT,
    p_amount NUMERIC,
    p_expense_type TEXT,
    p_category TEXT,
    p_description TEXT,
    p_timestamp TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reserved BOOLEAN;
    v_transaction_id UUID;
    v_timestamp TIMESTAMPTZ;
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM public.hardware_devices
         WHERE id = p_device_id
           AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Invalid hardware device';
    END IF;

    INSERT INTO public.hardware_expense_idempotency (device_id, request_id)
    VALUES (p_device_id, p_request_id)
    ON CONFLICT (device_id, request_id) DO NOTHING
    RETURNING TRUE INTO v_reserved;

    IF NOT COALESCE(v_reserved, FALSE) THEN
        SELECT transaction_id
          INTO v_transaction_id
          FROM public.hardware_expense_idempotency
         WHERE device_id = p_device_id
           AND request_id = p_request_id;

        RETURN jsonb_build_object(
            'duplicate', TRUE,
            'transactionId', v_transaction_id
        );
    END IF;

    INSERT INTO public.transactions (
        user_id,
        device_id,
        amount,
        transaction_type,
        expense_classification,
        category,
        source,
        description,
        timestamp
    )
    VALUES (
        p_user_id,
        p_device_id,
        p_amount,
        'expense',
        p_expense_type,
        p_category,
        'hardware',
        p_description,
        p_timestamp
    )
    RETURNING id, timestamp INTO v_transaction_id, v_timestamp;

    UPDATE public.hardware_expense_idempotency
       SET transaction_id = v_transaction_id
     WHERE device_id = p_device_id
       AND request_id = p_request_id;

    RETURN jsonb_build_object(
        'duplicate', FALSE,
        'transactionId', v_transaction_id,
        'timestamp', v_timestamp
    );
END;
$$;

REVOKE ALL ON TABLE public.hardware_expense_idempotency FROM PUBLIC;
GRANT ALL ON TABLE public.hardware_expense_idempotency TO service_role;
REVOKE ALL ON FUNCTION public.record_hardware_expense(UUID, UUID, TEXT, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_hardware_expense(UUID, UUID, TEXT, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMPTZ) TO service_role;
