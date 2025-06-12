
export default function Home() {
  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow text-black">
      <h1 className="text-3xl font-bold mb-8 text-center">Your Vector Dashboard</h1>
      <div className="flex flex-col items-center mb-10">
        <span className="text-lg font-semibold mb-2">Vector Score</span>
        <span className="text-7xl font-extrabold text-blue-600">0</span>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4">Top Event Submissions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border-b text-left">Event</th>
                <th className="px-4 py-2 border-b text-left">Value</th>
                <th className="px-4 py-2 border-b text-left">Unit</th>
                <th className="px-4 py-2 border-b text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {/* TODO: Map over user's top event submissions here */}
              <tr>
                <td className="px-4 py-2 border-b">—</td>
                <td className="px-4 py-2 border-b">—</td>
                <td className="px-4 py-2 border-b">—</td>
                <td className="px-4 py-2 border-b">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
