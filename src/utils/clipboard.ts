import { Message } from '@arco-design/web-vue'

export const copyToClipboard = async (text: string, successMessage = 'Copied') => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      Message.success(successMessage)
      return
    }
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'absolute'
    textArea.style.left = '-9999px'
    textArea.style.top = '-9999px'
    textArea.style.opacity = '0'
    textArea.setAttribute('readonly', '')
    textArea.setAttribute('tabindex', '-1')
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    textArea.setSelectionRange(0, text.length)
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    if (successful) Message.success(successMessage)
    else throw new Error('Copy command failed')
  } catch (err) {
    console.error('Copy failed:', err)
    alert(`Copy content: ${text}`)
    Message.warning('Please copy manually')
  }
}
