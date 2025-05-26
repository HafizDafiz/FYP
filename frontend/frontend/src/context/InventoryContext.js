import { createContext, useReducer } from 'react';

export const InventoryContext = createContext();

export const inventoryReducer = (state, action) => {
    switch (action.type) {
        case 'SET_INVENTORIES':
            return {
                inventories: action.payload
            }
        case 'CREATE_INVENTORY':
            return {
                inventories: [action.payload, ...state.inventories]
            }
        case 'DELETE_INVENTORY':
            return {
                inventories: state.inventories.filter((i) => i._id !== action.payload._id)
            }

        default:
            return state;
    }
}
export const InventoryContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(inventoryReducer, {
        inventories: null,
    });
    return (
        <InventoryContext.Provider value={{...state, dispatch}}>
            {children}
        </InventoryContext.Provider>
    )
}