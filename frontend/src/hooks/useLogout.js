import { useAuthContext } from './useAuthContext'
import { useInventoryContext } from './useInventoryContext'

export const useLogout = () => {
  const { dispatch } = useAuthContext()
  const { dispatch: dispatchInventory } = useInventoryContext()

  const logout = () => {
    // remove user from storage
    localStorage.removeItem('user')

    // dispatch logout action
    dispatch({ type: 'LOGOUT' })
    dispatchInventory({ type: 'SET_INVENTORIES', payload: null })
  }

  return { logout }
}