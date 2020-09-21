import React, { Component } from 'react'
import classnames from 'classnames'
import OutsideClickHandler from 'react-outside-click-handler'
import {
    fetch,
    defaultStatePrototypes,
    checkNewNotifications,
    setReadNotifications,
} from './helpers'
import { connect } from 'react-redux'
import Content from './content'
import Loader from '../../front/components/shared/loader'
import SnIcon from '../../front/components/shared/sn-icon'
import { i18n } from '../../validator'

@i18n()
class Notifications extends Component {
    constructor(props) {
        super(props)

        this.state = defaultStatePrototypes()
    }

    /**
     * Set interval for check new notifications
     */
    componentWillMount = () => {
        checkNewNotifications()

        this.notificationsInterval = setInterval(() => checkNewNotifications(), 50000)
    }

    componentWillUnmount = () => {
        this.toggleInfiniteScroll(false)

        if (this.notificationsInterval) {
            clearInterval(this.notificationsInterval)
        }
    }

    /**
     * Show or hide loader by defined state
     *
     * @param state
     */
    setLoader = state => {
        this.setState({ showLoader: state })
    }

    /**
     * Show / hide popup
     */
    togglePopup = () => {
        const popupOpen = !this.state.popupOpen
        this.setState({ popupOpen })

        if (popupOpen && (Object.values(this.props.notifications).length === 0 || this.props.isActive)) {
            this.setLoader(true)
            fetch(true).then(() => {
                setReadNotifications().then(() => {
                    this.setLoader(false)
                })
            })
            this.toggleInfiniteScroll(true)
        } else {
            this.toggleInfiniteScroll(false)
        }
    }

    /**
      * Appyl or deny infinite scroll
     *
      * @param enable
     */
    toggleInfiniteScroll = (enable = false) => {
        if (!this.refs.notifications) {
            return
        }
        if (enable) {
            this.refs.notifications.refs['not-body'].addEventListener('scroll', this.infiniteScrollHandler)
        } else {
            this.refs.notifications.refs['not-body'].removeEventListener('scroll', this.infiniteScrollHandler)
        }
    }

    /**
     * Register handler for infinte scroll handler (load more notifications)
     *
     * @return {void}
     */
    infiniteScrollHandler = () => {
        const refElement = this.refs.notifications.refs['not-body']
        if (!this.props.busy) {
            if ((refElement.scrollTop + refElement.offsetHeight) >= (refElement.scrollHeight - 40)) {
                this.setLoader(true)
                fetch().then(() => this.setLoader(false))
            }
        }
    }

    render() {
        const { popupOpen } = this.state
        const {
            notifications,
            isActive,
            busy,
            cursor,
            t,
            lockPopup,
        } = this.props

        return (
            <OutsideClickHandler
                onOutsideClick={() => lockPopup ? {} : this.setState({ popupOpen: false })}
            >
                <div className="cursor-pointer position-relative">
                    <div
                        className="icon-link"
                        onClick={this.togglePopup}
                    >
                        <SnIcon className={classnames({
                            'sn-notification': true,
                            'sn-notification--active': isActive,
                        })}
                        />
                        <p>{t('notification')}</p>
                    </div>

                    <div className={classnames({
                        'Notifications-main Notifications-main-popup': true,
                        'Notifications-main-show': popupOpen,
                    })} >
                        {this.state.showLoader &&
                            <div className="Notifications-main-overlay">
                                <div className="d-flex align-items-center justify-content-center w-100 h-100">
                                    <Loader />
                                </div>
                            </div>
                        }

                        <Content
                            notifications={notifications}
                            container={this}
                            ref="notifications"
                            refbody="not-body"
                            cursor={cursor}
                            busy={busy}
                            loadMoreHandler={() => {}}
                            overlayLoaderClassName="position-absolute"
                            toggleFunc={this.togglePopup}
                        />
                    </div>
                </div>
            </OutsideClickHandler>
        )
    }
}

export default connect(state => ({
    notifications: state.app.notifications ? state.app.notifications.data : [],
    busy: state.ui.busySections.notifications,
    isActive: state.app.notifications ? state.app.notifications.active : false,
    cursor: state.app.notifications ? state.app.notifications.cursor : false,
    lockPopup: state?.app?.notifications?.lockPopup,
}))(Notifications)
