interface DiffProps {
  oldText: string;
  newText: string;
}

export function Diff({ oldText, newText }: DiffProps) {
  const showDiff = () => {
    // Simple diff visualization
    if (oldText === newText) return <span>{oldText}</span>;

    return (
      <div className="flex flex-col gap-2">
        <div className="bg-red-100 p-2 rounded-md">
          <span className="text-red-600">- {oldText}</span>
        </div>
        <div className="bg-green-100 p-2 rounded-md">
          <span className="text-green-600">+ {newText}</span>
        </div>
      </div>
    );
  };

  return <div className="font-mono text-sm">{showDiff()}</div>;
}
