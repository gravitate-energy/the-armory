import { Modal } from 'antd'
import { useCallback, useEffect } from 'react'
import type { unstable_BlockerFunction as BlockerFn } from 'react-router-dom'
import { unstable_useBlocker as useBlocker } from 'react-router-dom'

interface IHookProps {
  blockCondition: boolean
  modalTitle?: string
  modalContent?: string
}

export const useNavigationBlock = ({
  blockCondition,
  modalTitle = 'Are you sure you want to leave this page?',
  modalContent = 'You have unsaved changes that will be lost.',
}: IHookProps) => {
  const shouldBlock = useCallback<BlockerFn>(
    (event) => blockCondition,
    [blockCondition]
  )

  const blocker = useBlocker(shouldBlock)

  useEffect(() => {
    window.onbeforeunload = blockCondition ? () => true : null
    return () => {
      window.onbeforeunload = null
    }
  }, [blockCondition])

  useEffect(() => {
    if (blocker.state === 'blocked') {
      Modal.confirm({
        title: modalTitle,
        content: modalContent,
        okText: 'Leave',
        cancelText: 'Stay',
        onOk: () => {
          blocker.proceed()
          console.log(1)
          blocker.reset()
        },
        onCancel: () => {
          console.log(2)
          blocker.reset()
        },
      })
    }

    return () => {
      Modal.destroyAll()
      if (blocker.state === 'blocked') {
        blocker.reset()
      }
    }
  }, [blocker])

  return blocker
}
