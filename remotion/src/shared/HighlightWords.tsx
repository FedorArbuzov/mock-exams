import React, {createContext, useContext} from "react";
import {BASE_HIGHLIGHT_WORDS} from "./constants";

const HighlightWordsContext = createContext<readonly string[]>(BASE_HIGHLIGHT_WORDS);

type HighlightWordsProviderProps = {
  /** Episode-specific keywords; base CTA/branding words are always included. */
  words: readonly string[];
  children: React.ReactNode;
};

export const HighlightWordsProvider: React.FC<HighlightWordsProviderProps> = ({
  words,
  children,
}) => (
  <HighlightWordsContext.Provider value={[...words, ...BASE_HIGHLIGHT_WORDS]}>
    {children}
  </HighlightWordsContext.Provider>
);

export const useHighlightWords = () => useContext(HighlightWordsContext);
