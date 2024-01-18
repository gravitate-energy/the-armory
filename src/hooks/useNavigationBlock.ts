import { Modal } from 'antd'
import { useCallback, useEffect } from 'react'
import type { unstable_BlockerFunction as BlockerFn } from 'react-router-dom'
import { unstable_useBlocker as useBlocker } from 'react-router-dom'

interface IHookProps {
  blockCondition: boolean
  modalTitle?: string
  modalContent?: string
  beforeProceed?: (blocker: ReturnType<typeof useBlocker>) => Promise<void>
}

export const useNavigationBlock = ({
  blockCondition,
  modalTitle = 'Are you sure you want to leave this page?',
  modalContent = 'You have unsaved changes that will be lost.',
  beforeProceed,
}: IHookProps) => {
  const shouldBlock = useCallback<BlockerFn>(
    (event) => blockCondition,
    [blockCondition]
  )

  const blocker = useBlocker(shouldBlock)

  // This will block hard reloads in the browser if changes are unsaved
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
        onOk: async () => {
          if (beforeProceed && typeof beforeProceed === 'function') {
            await beforeProceed(blocker)
          }
          blocker.proceed()
        },
        onCancel: () => {
          blocker.reset()
        },
      })
    }
  }, [blocker])

  return blocker
}
