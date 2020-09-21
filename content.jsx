import React, {
    Fragment,
} from 'react'

import { LinkOrDiv } from '../../front/components/events/helpers'
import Configurator from '../../configurator'
import Button from '../../front/components/shared/sn-button'
import {
    S_SPORTNECT,
    CHECK_ACCESS_TYPE_OTHER,
} from '../../consts'
import store from '../../admin/store'
import OverlayLoader from '../shared/overlay-loader'
import {
    i18nWrapper,
    withRouterConnectWrapper,
} from '../../validator'
import parseCheckAccessToLink from '../check/access/parser'

class Content extends Configurator {
    /**
     * Show popup for redirecting into Sportnect
     *
     * @param {string} webLink - link to Sportnect
     * @return {null}
     */
    callPopupToSportnect = webLink => {
        const { t } = this.props

        store.dispatch({
            type: 'NOTIFICATIONS_LOCK_POPUP',
            lockPopup: true,
        })

        return window.swconfirm({
            title: t('notificationsRedirect.title', { system: this.config.REACT_APP_SYSTEM_NAME }),
            onConfirm: () => new Promise(resolve => {
                const linkParams = {
                    ...store?.getState?.()?.auth?.tokens || {},
                    callback: webLink,
                }

                const serializedLinkParams = Object.entries(linkParams)
                    .map(([key, val]) => `${key}=${val}`)
                    .join('&')

                resolve(window.open(`${webLink}?${serializedLinkParams}`, '_blank'))
            }),
            onCancel: () => (
                store.dispatch({
                    type: 'NOTIFICATIONS_LOCK_POPUP',
                    lockPopup: false,
                })
            ),
            confirmBtnText: t('notificationsRedirect.confirmButton'),
            cancelBtnText: t('notificationsRedirect.declineButton'),
            type: 'info',
            confirmBtnBsStyle: 'info',
        })
    }

    /**
     * Get notification redirect link
     *
     * @param {Object} notification
     * @return {*}
     */
    getRedirectLink = notification => {
        const webLink = notification?.data?.webLink

        const {
            REACT_APP_API_URL: apiUrl,
            REACT_APP_SYSTEM: system,
        } = this.config

        const { history } = this.props

        if (system !== S_SPORTNECT) {
            if (webLink?.toLowerCase?.()?.includes?.('/admin/')) {
                return this.callPopupToSportnect(webLink)
            }

            store.dispatch({
                type: 'TOGGLE_BUSY_SECTION',
                section: 'notificationsCheckAccess',
            })

            return this.axios.post(`${apiUrl}api/check/access`, { url: webLink })
                .then(({ data }) => {
                    const response = data?.data

                    if (response?.type === CHECK_ACCESS_TYPE_OTHER) {
                        return this.callPopupToSportnect(webLink)
                    }

                    return history.push(parseCheckAccessToLink(response))
                })
                .finally(() => (
                    store.dispatch({
                        type: 'TOGGLE_BUSY_SECTION',
                        section: 'notificationsCheckAccess',
                    })
                ))
        }

        if (webLink?.toLowerCase?.()?.includes?.('http')) {
            /**
             * Replace hard link to React like link inside system
             * * split string by '//'   -> for removing http|https
             * * take first element     -> take clear link without protocol
             * * split string by '/'    -> prepare for removing host
             * * remove first element   -> remove host
             * * join array into string -> back structuralization
             * * make sure, when link starts with '/'
             */
            return `/${webLink?.split?.('//')?.[1]?.split?.('/')?.slice?.(1)?.join?.('/')}`
                .replace('//', '/')
        }

        return `/${webLink}`.replace('//', '/')
    }

    /**
     * Render
     *
     * @return {*}
     */
    render() {
        const {
            notifications,
            busy,
            refbody,
            loadMoreButton,
            cursor,
            loadMoreHandler,
            busyCheckAccess,
            overlayLoaderClassName,
            t,
            toggleFunc,
        } = this.props

        const { REACT_APP_SYSTEM: system } = this.config

        return (
            <Fragment>
                <div className="Notifications-main__body" ref={refbody}>
                    {!busy && Object?.keys?.(notifications)?.length === 0 && (
                        <div className="Notifications-main__no-result">
                            <i className="fa fa-info-circle Notifications-main__no-result-icon" />
                            {t('noticeEmptyMessage')}
                        </div>
                    )}

                    {Object?.values?.(notifications)?.map?.(notification => (
                        <LinkOrDiv
                            reactLink={true}
                            className="Notifications-main__body-wrapper"
                            key={notification.id}
                            href={system === S_SPORTNECT ? this.getRedirectLink(notification) : null}
                            onClick={system !== S_SPORTNECT ? () => this.getRedirectLink(notification) : () => toggleFunc?.()}
                        >
                            <div className="Notifications-main__body-wrapper-image">
                                <img src={notification.data.image} alt="notif-img" />
                            </div>
                            <div className="Notifications-main__body-wrapper-content">
                                <div className="Notifications-main__body-wrapper-content-text">
                                    {notification.data.message}
                                </div>
                                <div className="Notifications-main__body-wrapper-content-date">
                                    {moment
                                        .utc(notification.created_at)
                                        .local()
                                        .format('llll')}
                                </div>
                            </div>
                        </LinkOrDiv>
                    ))}
                </div>
                <div className="Notifications-main__footer">
                    {!!cursor && loadMoreButton && (
                        <Button
                            onClick={() => loadMoreHandler()}
                            className="btn btn-color-gray-light-1 Notifications-main__footer-button"
                        >
                            {t('loadNext')}
                        </Button>
                    )}
                    {!loadMoreButton && (
                        <Button
                            href="/notifications"
                            className="btn btn-color-gray-light-1 Notifications-main__footer-button"
                        >
                            {t('showAll')}
                        </Button>
                    )}
                </div>
                {busyCheckAccess && <OverlayLoader className={overlayLoaderClassName} />}
            </Fragment>
        )
    }
}

export default withRouterConnectWrapper(state => ({
    busyCheckAccess: state.ui.busySections.notificationsCheckAccess,
}))(i18nWrapper(Content))
