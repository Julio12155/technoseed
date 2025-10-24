require('dotenv').config()
const express = require('express')
const session = require('express-session')
const MySQLStore = require('express-mysql-session')(session)
const mysql = require('mysql2/promise')

const app = express()
app.use(express.json())

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
})

const sessionStore = new MySQLStore({}, pool)

app.use(session({
  key: 'sid',
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  }
}))

const users = [
  { id: 1, username: 'usuario', password: '1234' }
]

app.post('/login', (req, res) => {
  const { username, password } = req.body
  const user = users.find(u => u.username === username && u.password === password)
  if (!user) return res.status(401).json({ mensaje: 'Usuario o contraseña incorrecta' })

  req.session.userId = user.id
  req.session.username = user.username
  res.json({ mensaje: 'Has iniciado sesión correctamente' })
})

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ mensaje: 'Error al cerrar sesión' })
    res.clearCookie('sid')
    res.json({ mensaje: 'Has cerrado sesión' })
  })
})

function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next()
  res.status(401).json({ mensaje: 'No autorizado' })
}

app.get('/perfil', requireAuth, (req, res) => {
  res.json({ id: req.session.userId, usuario: req.session.username })
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Servidor en http://localhost:${port}`))
