import React, { Component } from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import styles from './UserCard.module.scss'
import { PROJECT_ROLES } from '../../config/constants'
import PrimaryButton from '../Buttons/PrimaryButton'
import AlertModal from '../Modal/AlertModal'
import { updateProjectMemberRole } from '../../services/projects'
import { wait } from '../../util/helper'
import _ from 'lodash'

const theme = {
  container: styles.modalContainer
}

class UserCard extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isUpdatingPermission: false,
      showWarningModal: false,
      permissionUpdateError: null,
      showSuccessModal: false
    }
    this.updatePermission = this.updatePermission.bind(this)
    this.resetPermState = this.resetPermState.bind(this)
  }

  resetPermState () {
    this.setState({
      isUpdatingPermission: false,
      showWarningModal: false,
      permissionUpdateError: null,
      showSuccessModal: false
    })
  }

  async updatePermission (newRole) {
    if (this.state.isUpdatingPermission) { return }

    this.setState({
      isUpdatingPermission: true
    })

    const { user, reloadProjectMembers } = this.props

    try {
      await updateProjectMemberRole(user.projectId, user.id, newRole)
      await wait(1000)
      reloadProjectMembers(user.projectId)
      this.setState({ showSuccessModal: true })
    } catch (e) {
      const error = _.get(
        e,
        'response.data.message',
        `Unable to update permission`
      )
      this.setState({ showWarningModal: true, permissionUpdateError: error })
    }
  }

  render () {
    const { user, onRemoveClick } = this.props
    const showRadioButtons = _.includes(_.values(PROJECT_ROLES), user.role)
    return (
      <div>
        {
          this.state.isUpdatingPermission && (
            <AlertModal
              message={`Updating permission for ${user.handle}...`}
              theme={theme}
            />
          )
        }
        {this.state.showWarningModal && (
          <AlertModal
            title={`Cannot update permission for ${user.handle}`}
            message={this.state.permissionUpdateError}
            theme={theme}
            closeText='OK'
            onClose={this.resetPermState}
          />
        )}
        {this.state.showSuccessModal && (
          <AlertModal
            title={`Permission updated successfully!`}
            message={''}
            theme={theme}
            closeText='OK'
            onClose={this.resetPermState}
          />
        )}
        <div className={styles.item}>
          <div className={cn(styles.col5)}>
            {user.handle}
          </div>
          <div className={cn(styles.col5)}>
            {showRadioButtons && (<div className={styles.tcRadioButton}>
              <input
                name={`user-${user.id}`}
                type='radio'
                id={`read-${user.id}`}
                checked={user.role === PROJECT_ROLES.READ}
                onChange={(e) => e.target.checked && this.updatePermission(PROJECT_ROLES.READ)}
              />
              <label htmlFor={`read-${user.id}`}>
                <div>
                  Read
                </div>
                <input type='hidden' />
              </label>
            </div>)}
          </div>
          <div className={cn(styles.col5)}>
            {showRadioButtons && (<div className={styles.tcRadioButton}>
              <input
                name={`user-${user.id}`}
                type='radio'
                id={`write-${user.id}`}
                checked={user.role === PROJECT_ROLES.WRITE}
                onChange={(e) => e.target.checked && this.updatePermission(PROJECT_ROLES.WRITE)}
              />
              <label htmlFor={`write-${user.id}`}>
                <div>
                  Write
                </div>
                <input type='hidden' />
              </label>
            </div>)}
          </div>
          <div className={cn(styles.col5)}>
            {showRadioButtons && (<div className={styles.tcRadioButton}>
              <input
                name={`user-${user.id}`}
                type='radio'
                id={`full-access-${user.id}`}
                checked={user.role === PROJECT_ROLES.MANAGER}
                onChange={(e) => e.target.checked && this.updatePermission(PROJECT_ROLES.MANAGER)}
              />
              <label htmlFor={`full-access-${user.id}`}>
                <div>
                  Full Access
                </div>
                <input type='hidden' />
              </label>
            </div>)}
          </div>
          <div className={cn(styles.col5)}>
            {showRadioButtons && (<div className={styles.tcRadioButton}>
              <input
                name={`user-${user.id}`}
                type='radio'
                id={`copilot-${user.id}`}
                checked={user.role === PROJECT_ROLES.COPILOT}
                onChange={(e) => e.target.checked && this.updatePermission(PROJECT_ROLES.COPILOT)}
              />
              <label htmlFor={`copilot-${user.id}`}>
                <div>
                  Copilot
                </div>
                <input type='hidden' />
              </label>
            </div>)}
          </div>
          <div className={cn(styles.col5)}>
            <PrimaryButton
              text={'Remove'}
              type={'danger'}
              onClick={() => { onRemoveClick(user) }} />
          </div>
        </div>
      </div>
    )
  }
}

UserCard.propTypes = {
  user: PropTypes.object,
  reloadProjectMembers: PropTypes.func.isRequired,
  onRemoveClick: PropTypes.func.isRequired
}

export default UserCard
