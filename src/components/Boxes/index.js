import React from 'react';

/**
 * 彩色說明框，外觀比照網站設計稿。
 *
 *   <Analogy title="💡 比喻：...">內容（支援 Markdown）</Analogy>
 *   <Scenario title="真實情境：...">內容</Scenario>
 *   <Cost>內容</Cost>
 *   <Vocab title="📌 先認識這些名詞">內容</Vocab>
 *
 * 注意：JSX 內若要用 Markdown（清單、粗體），內容前後要留空行。
 */
export function Analogy({title, children}) {
  return (
    <div className="cbox cbox--analogy">
      {title && <div className="cbox__title">{title}</div>}
      <div className="cbox__body">{children}</div>
    </div>
  );
}

export function Scenario({title, children}) {
  return (
    <div className="cbox cbox--scenario">
      {title && <div className="cbox__title">{title}</div>}
      <div className="cbox__body">{children}</div>
    </div>
  );
}

export function Cost({title = '💰 成本提醒', children}) {
  return (
    <div className="cbox cbox--cost">
      {title && <div className="cbox__title">{title}</div>}
      <div className="cbox__body">{children}</div>
    </div>
  );
}

export function Vocab({title = '📌 先認識這些名詞', children}) {
  return (
    <div className="cbox cbox--vocab">
      {title && <div className="cbox__title">{title}</div>}
      <div className="cbox__body">{children}</div>
    </div>
  );
}

/**
 * 官方資料與延伸閱讀框。每篇文章底部放一個，裡面用 Markdown 清單列連結：
 *
 *   <Refs>
 *
 *   - [AWS 官方文件：IAM 使用者指南](https://docs.aws.amazon.com/...)
 *   - [AWS 最佳實務](https://docs.aws.amazon.com/...)
 *
 *   </Refs>
 */
export function Refs({title = '📚 官方資料與延伸閱讀', children}) {
  return (
    <div className="cbox cbox--refs">
      {title && <div className="cbox__title">{title}</div>}
      <div className="cbox__body">{children}</div>
    </div>
  );
}
