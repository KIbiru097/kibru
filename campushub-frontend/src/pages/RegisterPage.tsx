import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';
import { REGISTER } from '../lib/queries';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const [doRegister, { loading }] = useMutation(REGISTER, {
    onCompleted: (data) => {
      login(data.register.token, data.register.user);
      navigate('/');
    },
    onError: (err) => setError(err.message)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    doRegister({ variables: { input: form } });
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const fields = [
    { name: 'firstName', label: 'First Name', icon: User, type: 'text', placeholder: 'John' },
    { name: 'lastName', label: 'Last Name', icon: User, type: 'text', placeholder: 'Doe' },
    { name: 'email', label: 'Email', icon: Mail, type: 'email', placeholder: 'you@university.edu' },
    { name: 'phone', label: 'Phone', icon: Phone, type: 'tel', placeholder: '+251...' },
    { name: 'password', label: 'Password', icon: Lock, type: 'password', placeholder: 'Min 6 characters' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 -mt-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-[var(--font-heading)] text-2xl font-bold">C</span>
          </div>
          <h1 className="text-3xl font-bold font-[var(--font-heading)]">Join CampusHub</h1>
          <p className="text-text-muted mt-2">Create your account in seconds</p>
        </div>

        <div className="bg-surface rounded-3xl p-8 shadow-lg border border-border">
          {error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-2xl mb-4 text-sm font-medium">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {fields.slice(0, 2).map(({ name, label, icon: Icon, type, placeholder }) => (
                <div key={name}>
                  <label className="block text-sm font-semibold text-text mb-1.5">{label}</label>
                  <div className="relative">
                    <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input type={type} value={(form as Record<string, string>)[name]} onChange={update(name)} required
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-bg-alt text-text text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder={placeholder} />
                  </div>
                </div>
              ))}
            </div>

            {fields.slice(2).map(({ name, label, icon: Icon, type, placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-semibold text-text mb-1.5">{label}</label>
                <div className="relative">
                  <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input type={type} value={(form as Record<string, string>)[name]} onChange={update(name)} required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-bg-alt text-text text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder={placeholder} />
                </div>
              </div>
            ))}

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Account'} {!loading && <ArrowRight size={18} />}
            </motion.button>
          </form>

          <p className="text-center text-text-muted text-sm mt-5">
            Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
