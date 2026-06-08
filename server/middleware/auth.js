import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET || 'studyconnect-dev-secret-change-me';

export function createSession(user) {
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    jwtSecret,
    { expiresIn: '8h' }
  );

  return { userId: user.id, email: user.email, name: user.name, token, startedAt: Date.now() };
}

export function requireAuth(req, res, next) {
  const [scheme, token] = String(req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Sesion no autorizada.' });
  }

  try {
    req.auth = jwt.verify(token, jwtSecret);
    next();
  } catch {
    return res.status(401).json({ message: 'Sesion vencida o invalida. Inicia sesion nuevamente.' });
  }
}
