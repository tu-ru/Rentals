CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_properties_updated BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_units_updated BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_leases_updated BEFORE UPDATE ON leases
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_maintenance_requests_updated BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'tenant')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
