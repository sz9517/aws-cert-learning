import React, {useState} from 'react';

/**
 * 名詞白話提示。滑鼠移上去（或手機點一下）會顯示說明。
 * 縮寫名詞請填 en（英文全名）：顯示為「英文全名 + 白話說明」。
 *
 * 用法：
 *   <Term en="Elastic Compute Cloud" desc="AWS 上租來的一台雲端伺服器。">EC2</Term>
 *   <Term desc="證明你是誰、有沒有權限的通行密碼。">憑證</Term>
 */
export default function Term({children, en, desc}) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className={`term-gloss${open ? ' open' : ''}`}
      tabIndex={0}
      onClick={() => setOpen((o) => !o)}>
      {children}
      <span className="term-tip">
        {en && (
          <>
            <strong>{en}</strong>
            <br />
          </>
        )}
        {desc}
      </span>
    </span>
  );
}
