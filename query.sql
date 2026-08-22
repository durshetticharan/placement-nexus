SELECT email, LEFT("passwordHash", 20) AS hash_preview FROM users WHERE email = 'verifytest@example.com';
