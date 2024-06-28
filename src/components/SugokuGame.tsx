import { ChangeEvent, useEffect, useState } from "react";

type Response = {
  board: number[][];
};

const encodeBoard = (board) =>
  board.reduce(
    (result, row, i) =>
      result +
      `%5B${encodeURIComponent(row)}%5D${i === board.length - 1 ? "" : "%2C"}`,
    ""
  );

const encodeParams = (params) =>
  Object.keys(params)
    .map((key) => key + "=" + `%5B${encodeBoard(params[key])}%5D`)
    .join("&");

export const SugokuGame = () => {
  const [originalBoard, setOriginalBoard] = useState<number[][]>([]);
  const [board, setBoard] = useState<number[][]>([]);
  const [readOnly, setReadOnly] = useState<boolean[][]>();
  const [status, setStatus] = useState<string>("unsolved");

  const getBoard = async () => {
    const data: Response = await fetch(
      "https://sugoku.onrender.com/board?difficulty=random"
    ).then((res) => res.json());

    const board = data.board.map((row: number[]) => {
      return row.map((col: number) => {
        console.log(row);
        return col;
      });
    });

    const readOnly = data.board.map((row: number[]) => {
      return row.map((col: number) => {
        if (col !== 0) {
          return true;
        } else {
          return false;
        }
      });
    });

    setBoard(board);
    setOriginalBoard(board);
    setReadOnly(readOnly);
    setStatus("unsolved");
  };

  useEffect(() => {
    getBoard();
    return () => {};
  }, []);

  const handleOnChange = (
    e: ChangeEvent<HTMLInputElement>,
    rIndex: number,
    cIndex: number
  ) => {
    board[rIndex][cIndex] = Number(e.target.value);
    setBoard([...board]);
  };

  const handleValidate = () => {
    fetch("https://sugoku.onrender.com/validate", {
      method: "POST",
      body: encodeParams({ board }),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
      .then((res) => res.json())
      .then((res) => setStatus(res.status))
      .catch(console.warn);
  };

  const handleSolve = () => {
    fetch("https://sugoku.onrender.com/solve", {
      method: "POST",
      body: encodeParams({ board: originalBoard }),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
      .then((res) => res.json())
      .then((res) => {
        setBoard(res.solution);
        setReadOnly(Array(9).fill(Array(9).fill(true)));
        setStatus(res.status);
      })
      .catch(console.warn);
  };

  const handleReset = async () => {
    await getBoard();
  };

  return (
    <div className="flex flex-col justify-center items-center w-screen h-screen gap-2">
      <div className="grid grid-cols-9 w-96 h-96 border-black border-2 bg-black gap-[1px]">
        {board.map((row, rIndex) => {
          return row.map((col, cIndex) => {
            return (
              <input
                min="1"
                max="9"
                type="number"
                value={col !== 0 ? col : ""}
                readOnly={readOnly && readOnly[rIndex][cIndex]}
                onChange={(e) => handleOnChange(e, rIndex, cIndex)}
                className={`${cIndex === 2 || cIndex === 5 ? "border-r-2" : ""}
                  ${rIndex === 2 || rIndex === 5 ? "border-b-2" : ""}
                  border-black
                  bg-white
                  text-center
                  font-mono
                  `}
              />
            );
          });
        })}
      </div>
      <div className="w-96 flex justify-between gap-1 items-center">
        <div className="flex gap-1">
          <button
            className="p-2 bg-blue-500 rounded-md text-white"
            onClick={handleValidate}
          >
            Check
          </button>
          <button
            className="p-2 bg-green-500 rounded-md text-white"
            onClick={handleSolve}
          >
            Solve
          </button>
          <button
            className="p-2 bg-red-500 rounded-md text-white"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>

        <code>Status: {status}</code>
      </div>
    </div>
  );
};
