import GenerateForm from "@/components/generate/GenerateForm";

export default function GeneratePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
          Generate a Book
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
          Describe the book you want to create and let AI write it chapter by
          chapter. Generation takes 1–2 minutes.
        </p>
      </div>
      <GenerateForm />
    </main>
  );
}
