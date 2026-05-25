// src/index.ts
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'

import { errorHandler } from './middleware/errorHandler'

import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import customerRoutes from './routes/customers'
import customerRequestRoutes from './routes/customerRequests'
import productRoutes from './routes/products'
import teamRoutes from './routes/teams'
import quotationRoutes from './routes/quotations'
import orderRoutes from './routes/orders'
import notificationRoutes from './routes/notifications'
import dashboardRoutes from './routes/dashboard'
import reportRoutes from './routes/reports'
import activityLogRoutes from './routes/activityLogs'

const app = express()
const PORT = Number(process.env.PORT ?? 4000)

app.use(helmet())
app.use(compression())
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/customer-requests', customerRequestRoutes)
app.use('/api/products', productRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/quotations', quotationRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/activity-logs', activityLogRoutes)

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not Found' }))

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 ZUUGROUP API running on http://localhost:${PORT}`)
})
