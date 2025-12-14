export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
    // At least 6 characters
    return password.length >= 6;
}

export function isValidUsername(username: string): boolean {
    // 3-20 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
}

export interface ValidationError {
    field: string;
    message: string;
}

export function validateSignupData(data: {
    username: string;
    email: string;
    password: string;
}): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.username) {
        errors.push({ field: 'username', message: 'Username is required' });
    } else if (!isValidUsername(data.username)) {
        errors.push({
            field: 'username',
            message: 'Username must be 3-20 characters (letters, numbers, underscores only)',
        });
    }

    if (!data.email) {
        errors.push({ field: 'email', message: 'Email is required' });
    } else if (!isValidEmail(data.email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
    }

    if (!data.password) {
        errors.push({ field: 'password', message: 'Password is required' });
    } else if (!isValidPassword(data.password)) {
        errors.push({
            field: 'password',
            message: 'Password must be at least 6 characters',
        });
    }

    return errors;
}

export function validateSigninData(data: {
    email: string;
    password: string;
}): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.email) {
        errors.push({ field: 'email', message: 'Email is required' });
    }

    if (!data.password) {
        errors.push({ field: 'password', message: 'Password is required' });
    }

    return errors;
}