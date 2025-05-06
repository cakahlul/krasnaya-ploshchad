'use client';

import { useState, FormEvent } from 'react';
import { Input, Button, Card, Typography } from 'antd';
import { login } from '@src/lib/auth';

const { Title, Text } = Typography;

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      window.location.href = '/';
    } catch (error: any) {
      alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <Card
        className="w-full max-w-md p-8 shadow-lg rounded-2xl"
        style={{ borderTop: '4px solid var(--color-primary)' }}
      >
        <div className="text-center mb-6">
          <Title level={2} className="!text-primary">
            Welcome Back!
          </Title>
          <Text className="!text-secondary">Please login to your account</Text>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <Input
            size="large"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <Input.Password
            size="large"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            style={{
              backgroundColor: 'var(--color-secondary)',
              borderColor: 'var(--color-secondary)',
            }}
            className="hover:opacity-90"
          >
            Login
          </Button>

          <div className="text-center pt-4">
            <Text>
              Don't have an account?{' '}
              <a
                href="/signup"
                className="text-accent hover:text-primary font-semibold"
              >
                Sign Up
              </a>
            </Text>
          </div>
        </form>
      </Card>
    </div>
  );
}
