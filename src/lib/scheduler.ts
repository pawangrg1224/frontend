import cron from 'node-cron'
import { scheduleReminders, retryFailedNotifications } from '@/lib/notifications'

export function initScheduler() {
    // Run scheduleReminders every minute
    cron.schedule('* * * * *', async () => {
        await scheduleReminders()
    })
    // Run retryFailedNotifications every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        await retryFailedNotifications()
    })
}
