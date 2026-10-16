// 把自訂元件註冊成全域，這樣所有 .md / .mdx 檔都能直接使用
// <Term>、<Quiz>、<Flashcard>、<Flashcards>，不需要在每個檔案 import。
import MDXComponents from '@theme-original/MDXComponents';
import Term from '@site/src/components/Term';
import Quiz from '@site/src/components/Quiz';
import {Flashcard, Flashcards} from '@site/src/components/Flashcard';

export default {
  ...MDXComponents,
  Term,
  Quiz,
  Flashcard,
  Flashcards,
};
