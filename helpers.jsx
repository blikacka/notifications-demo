import store from '../../admin/store'

const config = window.APP_CONFIG

/**
 * Get notifications and save it to store
 *
 * @param reset
 * @param limit
 * @returns {Promise}
 */
export function fetch(reset = false, limit = 20) {
    const appState = store.getState()

    const notifications = appState.app.notifications
    const busy = appState.ui.busySections.events
    const cursor = reset ? 0 : notifications.cursor

    if (cursor === null || busy) {
        return new Promise(resolve => resolve())
    }

    store.dispatch({
        type: 'TOGGLE_BUSY_SECTION',
        section: 'notifications',
    })

    return window.axios.get(`${config.REACT_APP_API_URL}api/notifications?limit=${limit}&cursor=${cursor}`).then(({ data }) => {
        store.dispatch({
            type: 'TOGGLE_BUSY_SECTION',
            section: 'notifications',
        })

        return store.dispatch({
            type: 'NOTIFICATIONS_FETCHED',
            notifications: data.data,
            meta: data.meta,
            reset,
        })
    })
}

/**
 * Check if new notifications are available
 *
 * @returns {function(*)}
 */
export function checkNewNotifications() {
    store.dispatch({
        type: 'TOGGLE_BUSY_SECTION',
        section: 'notifications',
    })

    return window.axios.get(`${config.REACT_APP_API_URL}api/notifications?unread`).then(result => {
        store.dispatch({
            type: 'TOGGLE_BUSY_SECTION',
            section: 'notifications',
        })

        if (result && result.data) {
            return store.dispatch({
                type: 'NOTIFICATIONS_ACTIVE',
                active: result.data.data.length > 0,
            })
        }

        return new Promise(resolve => resolve())
    })
}

/**
 * Set notifications as read
 *
 * @returns {Promise}
 */
export function setReadNotifications() {
    store.dispatch({
        type: 'TOGGLE_BUSY_SECTION',
        section: 'notifications',
    })

    return window.axios.put(`${config.REACT_APP_API_URL}api/read-notifications`).then(() => {
        store.dispatch({
            type: 'TOGGLE_BUSY_SECTION',
            section: 'notifications',
        })

        return store.dispatch({
            type: 'NOTIFICATIONS_ACTIVE',
            active: false,
        })
    })
}

/**
 * Set default notifications state
 *
 * @returns {{popupOpen: boolean, isNewLoaded: boolean, showLoader: boolean}}
 */
export const defaultStatePrototypes = () => ({
    popupOpen: false,
    isNewLoaded: true,
    showLoader: false,
})
