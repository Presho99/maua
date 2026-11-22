Fix the PostgreSQL TLS certificate verification error in my Maua Flower Shop application.

I have downloaded the SSL CA certificate from my Supabase dashboard.

Please:

1. Inspect the existing Express backend and PostgreSQL connection pool configuration.
2. Identify how the application reads DATABASE_URL and configures SSL.
3. Configure the PostgreSQL client to trust the correct Supabase CA certificate while keeping `rejectUnauthorized: true`.
4. Check whether DATABASE_URL contains SSL parameters that could override the certificate configuration.
5. Ensure the certificate is available securely in both local development and Vercel production, without exposing database credentials or private environment variables to the frontend.
6. Do not disable TLS certificate verification or use `NODE_TLS_REJECT_UNAUTHORIZED=0`.
7. Test the database connection, login and signup endpoints.
8. Confirm that database queries work before making unrelated changes.
9. Explain which environment variables need to be configured on Vercel.

Preserve all existing application functionality. Do not modify unrelated code or deploy until the fix has been verified.