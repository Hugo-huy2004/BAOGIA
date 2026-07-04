import React from "react";

export default function JoyTransactions({ items = [] }){
  return (
    <ul className="joy-tx-list">
      {items.map(tx => (
        <li key={tx.id} className={`joy-tx ${tx.amount < 0 ? 'debit' : 'credit'}`}>
          <div className="tx-left">
            <div className="tx-label">{tx.label}</div>
            <div className="tx-date">{tx.when}</div>
          </div>
          <div className="tx-right">{tx.amount > 0 ? '+' : ''}{tx.amount} JOY</div>
        </li>
      ))}
    </ul>
  );
}
