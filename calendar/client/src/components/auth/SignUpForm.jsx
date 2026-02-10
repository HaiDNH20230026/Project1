import React, { useState } from 'react';
import {
  Box,
  Button,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { signUp } from 'api/authApi';

function SignUpForm({ onPrev, email }) {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const togglePassword = () => setShowPassword((prev) => !prev);

    // const [showConfirm, setShowConfirm] = useState(false);
    // const toggleConfirm = () => setShowConfirm((prev) => !prev);

    const formik = useFormik({
        initialValues: {
            name: '',
            password: '',
            // confirmPassword: ''
        },
        validationSchema: Yup.object({
            name: Yup.string()
                .required('Name is required'),
            password: Yup.string()
                .matches(
                    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/,
                    'Must be at least 8 characters and include letters, numbers, and special characters'
                )
                .required('Password is required'),
            // confirmPassword: Yup.string()
            //     .oneOf([Yup.ref('password'), null], 'Passwords do not match')
            //     .required('Password confirmation is required')
        }),
        onSubmit: async (values) => {
            const success = await signUp(email, values.password, values.name, 'LOCAL');
            if (success) navigate('/signin');
            else console.log('Sign-up failed');
        }
    });

  return (
    <Box
        sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 2,
            backgroundColor: '#fff',
            width: '50vw'
        }}
    >
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ width: '100%', maxWidth: 300 }}>
            <Stack spacing={2}>
                <Typography variant="h5" fontWeight="bold">Create Account</Typography>

                <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton
                        onClick={onPrev}
                        disableRipple
                        aria-label="Go back"
                        sx={{
                            borderRadius: 2,
                            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                            '&:active': { backgroundColor: 'rgba(0, 0, 0, 0.1)' }
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>

                    <Typography variant="body2" sx={{ fontSize: '14px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {email}
                    </Typography>
                </Stack>

                <TextField
                    fullWidth
                    label="Username"
                    name="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                />

                <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                            <IconButton
                                disableRipple
                                onClick={togglePassword}
                                aria-label="Toggle password visibility"
                                sx={{
                                    borderRadius: 2,
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    '&:active': { backgroundColor: 'rgba(0, 0, 0, 0.1)' }
                                }}
                            >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                {/* <TextField
                    fullWidth
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                    helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                    InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                        <IconButton onClick={toggleConfirm}>
                            {showConfirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                        </InputAdornment>
                    )
                    }}
                /> */}

                <Button type="submit" variant="contained" fullWidth size="large">Sign Up</Button>

                <Typography fontSize={14}>
                    Already have an account?{' '}
                    <a href="/signin" style={{ textDecoration: 'none', color: '#1976d2' }}>
                    Sign In
                    </a>
                </Typography>
            </Stack>
        </Box>
    </Box>
  );
}

export default SignUpForm;
