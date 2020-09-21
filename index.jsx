import React from 'react'
import Helmet from 'react-helmet'
import {
    fetch,
    defaultStatePrototypes,
    setReadNotifications,
} from './helpers'
import { getDocHeight } from '../../front/components/events/helpers'
import { connect } from 'react-redux'

import Configurator from '../../configurator'

import Content from './content'
import { i18n } from '../../validator'
import Loader from '../../front/components/shared/loader'

@i18n()
class NotificationsIndex extends Configurator {
    constructor(props) {
        super(props)

        this.state = defaultStatePrototypes()
    }

    /**
     * Get notifications
     */
    loadNotifications = () => {
        this.setLoader(true)
        fetch(true).then(() => {
            setReadNotifications().then(() => {
                this.setLoader(false)
            })
        })
    }

    componentWillMount = () => {
        this.loadNotifications()
    }

    componentDidMount = () => {
        this.addScrollListener(this.infiniteScrollHandler)
        this.setState({ isNewLoaded: false })
    }

    componentWillUnmount = () => {
        this.removeScrollListener(this.infiniteScrollHandler)
    }

    /**
     * Load notifications if is something new
     *
     * @param props
     */
    componentWillReceiveProps = props => {
        if (props.isActive && !this.state.isNewLoaded && !props.busy) {
            this.loadNotifications()
        }
    }

    /**
     * Register handler for infinte scroll handler (load more notifications)
     *
     * @return {void}
     */
    infiniteScrollHandler = () => {
        if (this.props.cursor) {
            if (this.getOffsetY() >= getDocHeight()) {
                fetch()
            }
        }
    }

    setLoader = state => {
        this.setState({ showLoader: state })
    }

    loadMoreHandler = () => {
        fetch()
    }

    render() {
        const {
            notifications,
            busy,
            cursor,
            t,
        } = this.props

        return (
            <div className="Notifications-main">
                <h2>{t('notice')}</h2>
                {this.state.showLoader &&
                    <div className="Notifications-main-page-loader">
                        <Loader />
                    </div>
                }
                {notifications &&
                    <div className="Notifications-main-page">
                        <Content
                            notifications={notifications}
                            container={this}
                            ref="notifications"
                            refbody="not-body"
                            cursor={cursor}
                            busy={busy || this.state.showLoader}
                            loadMoreHandler={this.loadMoreHandler}
                            loadMoreButton={true}
                        />
                    </div>
                }
                <Helmet title={t('notice')}/>
            </div>
        )
    }
}

export default connect(state => ({
    notifications: state.app.notifications ? state.app.notifications.data : [],
    busy: state.ui.busySections.notifications,
    isActive: state.app.notifications ? state.app.notifications.active : false,
    cursor: state.app.notifications ? state.app.notifications.cursor : false,
}))(NotificationsIndex)
