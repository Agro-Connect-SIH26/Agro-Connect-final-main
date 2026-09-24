import { createContext, useContext, useState, useEffect } from 'react'
import dictionary from './dictionary.json'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en')

  useEffect(() => {
    const saved = localStorage.getItem('ac_lang')
    if (saved) setLang(saved)
  }, [])

  const changeLang = (l) => {
    setLang(l)
    localStorage.setItem('ac_lang', l)
  }

  const t = (key) => {
    if (!dictionary[key]) return key
    return dictionary[key][lang] || dictionary[key]['en'] || key
  }

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
