import React, { useState } from 'react';
import {
  Box,
  Button,
  InputAdornment,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from "components/auth/AuthContext";

function SignInForm({ onPrev, email }) {
    const navigate = useNavigate();
    const authContext = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const togglePassword = () => setShowPassword((prev) => !prev);

    const formik = useFormik({
        initialValues: {
            password: '',
        },
        validationSchema: Yup.object({
            password: Yup.string()
                .matches(
                    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/,
                    'Must be at least 8 characters and include letters, numbers, and special characters'
                )
                .required('Password is required')
        }),
        onSubmit: async (values) => {

            const success = await authContext.login(email, values.password)
            if (success) navigate('/day');
            else {
                formik.setErrors({
                    password: 'Incorrect email or password. Please enter them correctly.'
                });
            }
        }
    });

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center', // Wedvertical center
                justifyContent: 'center', // Wedhorizontal center
                px: 2, // responsive padding
                backgroundColor: '#fff',
                width: '50vw'}}>

            <Box component="form" onSubmit={formik.handleSubmit} sx={{ width: '100%', maxWidth: 300 }}>
                <Stack spacing={2}>

                    {/* Heading */}
                    <Typography variant="h5" fontWeight="bold">
                        Sign In
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box>
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
                        </Box>

                        <Typography variant="body" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize:'14px', color:'#666666' }}>
                            {email}
                        </Typography>
                    </Stack>
                    {/* Input fields */}
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
                    

                    {/* Signup button */}
                    <Button type="submit" variant="contained" fullWidth size="large">
                        Sign In
                    </Button>

                    {/* Login link */}
                    <Typography fontSize={14}>
                        New to Calendar? {' '}
                        <a
                            href="/signup"
                            style={{ textDecoration: 'none', color: '#1976d2' }}>
                            Create Account
                        </a>
                    </Typography>
                </Stack>
            </Box>
        </Box>
    );
}

export default SignInForm;