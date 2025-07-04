CREATE OR REPLACE FUNCTION check_authn_tokens_reference()
    RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference_kind = 'user' THEN
        PERFORM 1 FROM users WHERE id = NEW.reference_id AND deleted_at IS NULL;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Invalid reference_id % for reference_kind user: user not found', NEW.reference_id;
        END IF;
    ELSIF NEW.reference_kind = 'cluster' THEN
        PERFORM 1 FROM clusters WHERE id = NEW.reference_id AND deleted_at IS NULL;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Invalid reference_id % for reference_kind cluster: cluster not found', NEW.reference_id;
        END IF;
    ELSE
        RAISE EXCEPTION 'Invalid reference_kind %', NEW.reference_kind;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER authn_tokens_reference_check
    BEFORE INSERT OR UPDATE ON authn_tokens
    FOR EACH ROW EXECUTE FUNCTION check_authn_tokens_reference();
