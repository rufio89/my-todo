export function TestComponent() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Test Component</h1>
        <p className="text-gray-600">If you can see this, the basic rendering is working.</p>
        <div className="mt-4 p-4 bg-green-100 rounded-lg">
          <p className="text-green-800">✅ Component rendered successfully!</p>
        </div>
      </div>
    </div>
  )
}
