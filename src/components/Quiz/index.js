import React, {useState} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

/**
 * 練習題。先自己點選答案，再按「顯示答案與解析」。
 * 解析寫在元件的 children（支援 Markdown）。
 *
 * 單選用法（answer 傳數字索引，A=0、B=1、C=2…）：
 *   <Quiz qnum={1} total={3}
 *     question="EC2 要讀取 S3，最佳做法是？"
 *     options={['把金鑰寫在程式裡', '存在環境變數', '建立 IAM Role 指派給 EC2', '用 Root 金鑰']}
 *     answer={2}>
 *   **正解：C** — 說明...
 *   </Quiz>
 *
 * 複選用法（answer 傳索引陣列，對應官方 Choose TWO/THREE 題型）：
 *   <Quiz qnum={2} total={3}
 *     question="下列哪兩項能達成高可用？（選兩項）"
 *     options={['跨多 AZ', 'RDS Multi-AZ', '集中單一 AZ', '換大機型', '關閉健康檢查']}
 *     answer={[0, 1]}>
 *   **正解：A、B** — 說明...
 *   </Quiz>
 *
 * 介面文字（題號、按鈕、正解/你選的徽章）會依網站語系自動切換中／英。
 */
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function Quiz({qnum, total, question, options = [], answer, children}) {
  const {i18n} = useDocusaurusContext();
  const en = i18n && i18n.currentLocale === 'en';

  const multi = Array.isArray(answer);
  const answers = multi ? answer : [answer];
  const [selected, setSelected] = useState(multi ? [] : null);
  const [revealed, setRevealed] = useState(false);

  const isSelected = (i) => (multi ? selected.includes(i) : selected === i);

  const toggle = (i) => {
    if (revealed) return;
    if (multi) {
      setSelected((prev) =>
        prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
      );
    } else {
      setSelected(i);
    }
  };

  let numLabel;
  if (qnum != null) {
    if (en) {
      numLabel = `Question ${qnum}${total != null ? ` of ${total}` : ''}`;
      if (multi) numLabel += ` · Choose ${answers.length}`;
    } else {
      numLabel = `第 ${qnum} 題${total != null ? ` / 共 ${total} 題` : ''}`;
      if (multi) numLabel += `（複選，請選 ${answers.length} 項）`;
    }
  }

  return (
    <div className={`quiz${revealed ? ' revealed' : ''}`}>
      {qnum != null && <div className="quiz-num">{numLabel}</div>}
      <div className="quiz-q">{question}</div>
      {options.map((opt, i) => {
        let cls = 'quiz-opt';
        if (isSelected(i)) cls += ' selected';
        if (revealed) {
          if (answers.includes(i)) cls += ' correct';
          else if (isSelected(i)) cls += ' wrong';
        }
        return (
          <div key={i} className={cls} onClick={() => toggle(i)}>
            {LETTERS[i]}. {opt}
          </div>
        );
      })}
      {!revealed ? (
        <button className="quiz-btn" onClick={() => setRevealed(true)}>
          {en ? 'Show answer & explanation' : '顯示答案與解析'}
        </button>
      ) : (
        <div className="quiz-explain">{children}</div>
      )}
    </div>
  );
}
