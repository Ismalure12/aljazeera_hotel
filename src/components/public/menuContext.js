'use client';
import { createContext, useContext } from 'react';

export const MenuContext = createContext(null);
export const useMenu = () => useContext(MenuContext);
