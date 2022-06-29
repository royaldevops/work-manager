/**
 * Component to render tabs in challenge view page
 */
import React, { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import cn from 'classnames'
import _ from 'lodash'

import ChallengeViewComponent from '../ChallengeView'
import { PrimaryButton } from '../../Buttons'
import LegacyLinks from '../../LegacyLinks'
import ForumLink from '../../ForumLink'
import Registrants from '../Registrants'
import Submissions from '../Submissions'
import { checkAdmin, getResourceRoleByName } from '../../../util/tc'
import { CHALLENGE_STATUS, MESSAGE } from '../../../config/constants'
import Tooltip from '../../Tooltip'
import CancelDropDown from '../Cancel-Dropdown'
import 'react-tabs/style/react-tabs.css'
import styles from './ChallengeViewTabs.module.scss'

function getSelectorStyle (selectedView, currentView) {
  return cn(styles['challenge-selector-common'], {
    [styles['challenge-selected-view']]: selectedView === currentView,
    [styles['challenge-unselected-view']]: selectedView !== currentView
  })
}

const ChallengeViewTabs = ({
  projectDetail,
  challenge,
  attachments,
  isBillingAccountExpired,
  metadata,
  challengeResources,
  challengeSubmissions,
  token,
  isLoading,
  challengeId,
  assignedMemberDetails,
  enableEdit,
  onLaunchChallenge,
  cancelChallenge,
  onCloseTask,
  projectPhases,
  assignYourselfCopilot,
  showRejectChallengeModal,
  loggedInUser,
  onApproveChallenge,
  getCustomerPaymentById,
  refundPayment
}) => {
  const [selectedTab, setSelectedTab] = useState(0)

  const registrants = useMemo(() => {
    const { resourceRoles } = metadata
    const role = getResourceRoleByName(resourceRoles, 'Submitter')
    if (role && challengeResources) {
      const registrantList = challengeResources.filter(
        resource => resource.roleId === role.id
      )
      // Add submission date to registrants
      registrantList.forEach((r, i) => {
        const submission = (challengeSubmissions || []).find(s => {
          return '' + s.memberId === '' + r.memberId
        })
        if (submission) {
          registrantList[i].submissionDate = submission.created
        }
      })
      return registrantList
    } else {
      return []
    }
  }, [metadata, challengeResources, challengeSubmissions])

  const submissions = useMemo(() => {
    return _.map(challengeSubmissions, s => {
      s.registrant = _.find(registrants, r => {
        return +r.memberId === s.memberId
      })
      return s
    })
  }, [challengeSubmissions, registrants])

  const isTask = _.get(challenge, 'task.isTask', false)

  const isSelfService = challenge.legacy.selfService
  const isDraft = challenge.status.toUpperCase() === CHALLENGE_STATUS.DRAFT
  const isSelfServiceCopilot = challenge.legacy.selfServiceCopilot === loggedInUser.handle
  const isAdmin = checkAdmin(token)
  const canApprove = isSelfServiceCopilot && isDraft && isSelfService
  const hasBillingAccount = _.get(projectDetail, 'billingAccountId') !== null
  // only challenges that have a billing account can be launched AND
  // if this isn't self-service, permit launching if the challenge is draft
  // OR if this isn't a non-self-service draft, permit launching if:
  // a) the current user is either the self-service copilot or is an admin AND
  // b) the challenge is approved
  const canLaunch = hasBillingAccount &&
    ((!isSelfService && isDraft) ||
      ((isSelfServiceCopilot || isAdmin) &&
        challenge.status.toUpperCase() === CHALLENGE_STATUS.APPROVED))

  const getCustomerPaymentId = () => {
    console.log(challenge)
    return challenge.metadata && challenge.metadata.filter(item => item.name === 'customerPayment')[0]
  }

  const paymentInfo = getCustomerPaymentId()

  const onRefund = () => {
    getCustomerPaymentById(paymentInfo.value)
      .then((res) => {
        console.log(res)
      })
  }

  return (
    <div className={styles.list}>
      <Helmet title='View Details' />
      <div className={styles.topContainer}>
        <div className={styles.leftContainer}>
          <div className={styles.title}>{challenge.name}</div>

          <div
            className={cn(
              styles.actionButtons,
              styles.button,
              styles.actionButtonsLeft
            )}
          >
            {isTask ? (<ForumLink challenge={challenge} />)
              : (<LegacyLinks challenge={challenge} challengeView />)
            }
          </div>

        </div>
        <div
          className={cn(
            styles.actionButtons,
            styles.button,
            styles.actionButtonsRight
          )}
        >
          {(isDraft || challenge.status === 'New') && !isSelfService &&
            (<div className={styles['cancel-button']}><CancelDropDown challenge={challenge} onSelectMenu={cancelChallenge} /></div>)}
          {canLaunch && (
            <div className={styles.button}>
              {challenge.legacyId || isTask ? (
                <PrimaryButton
                  text='Launch'
                  type='info'
                  onClick={onLaunchChallenge}
                />
              ) : (
                <Tooltip content={MESSAGE.NO_LEGACY_CHALLENGE}>
                  {/* Don't disable button for real inside tooltip, otherwise mouseEnter/Leave events work not good */}
                  <PrimaryButton text={'Launch'} type={'disabled'} />
                </Tooltip>
              )}
            </div>
          )}
          {canApprove && (
            <div className={styles.button}>
              <PrimaryButton
                text='Approve'
                type='info'
                onClick={onApproveChallenge}
              />
            </div>
          )}
          {isTask && challenge.status === 'Active' && (
            <div className={styles.button}>
              {assignedMemberDetails ? (
                <Tooltip content={MESSAGE.MARK_COMPLETE}>
                  <PrimaryButton text={'Mark Complete'} type={'success'} onClick={onCloseTask} />
                </Tooltip>
              ) : (
                <Tooltip content={MESSAGE.NO_TASK_ASSIGNEE}>
                  {/* Don't disable button for real inside tooltip, otherwise mouseEnter/Leave events work not good */}
                  <PrimaryButton text={'Mark Complete'} type={'disabled'} />
                </Tooltip>
              )}
            </div>
          )}
          {enableEdit && !isSelfService && (
            <PrimaryButton text={'Edit'} type={'info'} submit link={`./edit`} />
          )}
          {
            isSelfService && paymentInfo && (
              <PrimaryButton
                text='Refund'
                type='danger'
                onClick={onRefund}
              />
            )
          }
          {isSelfService && isDraft && (isAdmin || isSelfServiceCopilot) && (
            <div className={styles.button}>
              <PrimaryButton
                text='Reject challenge'
                type='danger'
                onClick={showRejectChallengeModal}
              />
            </div>
          )}
          <PrimaryButton text={'Back'} type={'info'} submit link={`..`} />
        </div>
      </div>
      <div className={styles['challenge-view-selector']}>
        <a
          tabIndex='0'
          role='tab'
          aria-selected={selectedTab === 0}
          onClick={e => {
            setSelectedTab(0)
          }}
          onKeyPress={e => {
            setSelectedTab(0)
          }}
          className={getSelectorStyle(selectedTab, 0)}
        >
          DETAILS
        </a>
        {registrants.length ? (
          <a
            tabIndex='1'
            role='tab'
            aria-selected={selectedTab === 1}
            onClick={e => {
              setSelectedTab(1)
            }}
            onKeyPress={e => {
              setSelectedTab(1)
            }}
            className={getSelectorStyle(selectedTab, 1)}
          >
            REGISTRANTS ({registrants.length})
          </a>
        ) : null}
        {challengeSubmissions.length ? (
          <a
            tabIndex='2'
            role='tab'
            aria-selected={selectedTab === 2}
            onClick={e => {
              setSelectedTab(2)
            }}
            onKeyPress={e => {
              setSelectedTab(2)
            }}
            className={getSelectorStyle(selectedTab, 2)}
          >
            SUBMISSIONS ({submissions.length})
          </a>
        ) : null}
      </div>
      {selectedTab === 0 && (
        <ChallengeViewComponent
          isLoading={isLoading}
          isBillingAccountExpired={isBillingAccountExpired}
          metadata={metadata}
          projectDetail={projectDetail}
          challenge={challenge}
          attachments={attachments}
          challengeResources={challengeResources}
          token={token}
          challengeId={challengeId}
          assignedMemberDetails={assignedMemberDetails}
          enableEdit={enableEdit}
          onLaunchChallenge={onLaunchChallenge}
          onCloseTask={onCloseTask}
          projectPhases={projectPhases}
          assignYourselfCopilot={assignYourselfCopilot}
          showRejectChallengeModal={showRejectChallengeModal}
          onApproveChallenge={onApproveChallenge}
          loggedInUser={loggedInUser}
        />
      )}
      {selectedTab === 1 && (
        <Registrants challenge={challenge} registrants={registrants} />
      )}
      {selectedTab === 2 && (
        <Submissions challenge={challenge} submissions={submissions} />
      )}
    </div>
  )
}

ChallengeViewTabs.defaultProps = {
  projectDetail: {},
  challenge: {},
  metadata: {},
  challengeResources: {},
  token: ''
}

ChallengeViewTabs.propTypes = {
  projectDetail: PropTypes.object,
  challenge: PropTypes.object,
  isBillingAccountExpired: PropTypes.bool,
  attachments: PropTypes.array,
  metadata: PropTypes.object,
  token: PropTypes.string,
  isLoading: PropTypes.bool.isRequired,
  challengeId: PropTypes.string.isRequired,
  challengeResources: PropTypes.arrayOf(PropTypes.object),
  challengeSubmissions: PropTypes.arrayOf(PropTypes.object),
  assignedMemberDetails: PropTypes.shape(),
  enableEdit: PropTypes.bool,
  onLaunchChallenge: PropTypes.func,
  cancelChallenge: PropTypes.func.isRequired,
  onCloseTask: PropTypes.func,
  projectPhases: PropTypes.arrayOf(PropTypes.object),
  assignYourselfCopilot: PropTypes.func.isRequired,
  showRejectChallengeModal: PropTypes.func.isRequired,
  loggedInUser: PropTypes.object.isRequired,
  onApproveChallenge: PropTypes.func,
  getCustomerPaymentById: PropTypes.func,
  refundPayment: PropTypes.func
}

export default ChallengeViewTabs
