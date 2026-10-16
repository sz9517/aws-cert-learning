import React, {useState} from 'react';

/**
 * 練習題。先自己點選答案，再按「顯示答案與解析」。
 * 解析寫在元件的 children（支援 Markdown）。
 *
 * 用法：
 *   <Quiz
 *     qnum={1}
 *     total={3}
 *     question="你的應用程式跑在 EC2 上，需要讀取 S3，最佳做法是？"
 *     options={[
 *       '把金鑰寫在程式碼裡',
 *       '把金鑰存在環境變數',
 *       '建立 IAM Role 指派給 EC2',
 *       '用 Root 金鑰',
 *     ]}
 *     answer={2}>
 *
 *   **正解：C** — 說明...
 *   </Quiz>
 *
 * answer 是正解的「索引」，從 0 開始（A=0、B=1、C=2、D=3）。
 */
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function Quiz({qnum, total, question, options = [], answer, children}) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  return (
    <div className={`quiz${revealed ? ' revealed' : ''}`}>
      {qnum != null && (
        <div className="quiz-num">
          第 {qnum} 題{total != null ? ` / 共 ${total} 題` : ''}
        </div>
      )}
      <div className="quiz-q">{question}</div>
      {options.map((opt, i) => {
        let cls = 'quiz-opt';
        if (selected === i) cls += ' selected';
        if (revealed) {
          if (i === answer) cls += ' correct';
          else if (selected === i) cls += ' wrong';
        }
        return (
          <div
            key={i}
            className={cls}
            onClick={() => !revealed && setSelected(i)}>
            {LETTERS[i]}. {opt}
          </div>
        );
      })}
      {!revealed ? (
        <button className="quiz-btn" onClick={() => setRevealed(true)}>
          顯示答案與解析
        </button>
      ) : (
        <div className="quiz-explain">{children}</div>
      )}
    </div>
  );
}
