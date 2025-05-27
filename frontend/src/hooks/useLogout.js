import { useAuthContext } from './useAuthContext'
import { useInventoryContext } from './useInventoryContext'
import { useNavigate } from 'react-router-dom';

export const useLogout = () => {
  const { dispatch } = useAuthContext()
  const { dispatch: dispatchInventory } = useInventoryContext()
  const navigate = useNavigate();

  const logout = () => {
    // remove user from storage
    localStorage.removeItem('user')

    // dispatch logout action
    dispatch({ type: 'LOGOUT' })
    dispatchInventory({ type: 'SET_INVENTORIES', payload: null })
    navigate('/login');
  }

  return { logout }
}