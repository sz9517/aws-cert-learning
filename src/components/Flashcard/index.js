import React, {useState} from 'react';

/**
 * 閃卡。初始只顯示名詞，點一下才翻開說明。
 *
 * 用法：
 *   <Flashcards>
 *     <Flashcard term="最小權限原則">只給剛好夠用的權限。</Flashcard>
 *     <Flashcard term="MFA">多因素驗證，Root 帳號務必開啟。</Flashcard>
 *   </Flashcards>
 */
export function Flashcard({term, children}) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className={`flashcard${flipped ? ' flipped' : ''}`}
      onClick={() => setFlipped((f) => !f)}>
      <div className="flashcard-term">{term}</div>
      <div className="flashcard-def">{children}</div>
    </div>
  );
}

export function Flashcards({children}) {
  return <div className="flashcards">{children}</div>;
}

export default Flashcard;
