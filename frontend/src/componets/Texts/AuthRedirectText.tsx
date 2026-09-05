import type { AuthRedirectTextType } from '../../types/AuthRedirectTextType'
import { Link } from 'react-router-dom'

function AuthRedirectText({linkText,text,to}:AuthRedirectTextType) {
  return (
    <p className="text-sm text-center mt-4">
          {text} <span className="text-blue-500 cursor-pointer"><Link to={to}>{linkText}</Link></span>
    </p>
  )
}

export default AuthRedirectText