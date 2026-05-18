import { useEffect, useMemo, useState } from "react";
import { useAuth } from "react-oidc-context";
import axios from "axios";
import { awsConfig } from "./config";

function App() {
  const auth = useAuth();

  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [apiMessage, setApiMessage] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fileCategoryFilter, setFileCategoryFilter] = useState("");

  const getToken = () => auth.user?.id_token;

  const signOutRedirect = () => {
    const logoutUrl =
      `${awsConfig.cognitoDomain}/logout` +
      `?client_id=${awsConfig.clientId}` +
      `&logout_uri=${encodeURIComponent(awsConfig.logoutUri)}`;

    window.location.href = logoutUrl;
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${awsConfig.apiBaseUrl}/categories`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      setCategories(response.data.categories || []);
    } catch (error) {
      console.error(error);
      setApiMessage(
        `Category error: ${error.response?.data?.message || error.message}`
      );
    }
  };

  const loadFiles = async (
    customSearch = searchTerm,
    customCategory = fileCategoryFilter
  ) => {
    try {
      const params = {};

      if (customSearch.trim()) {
        params.search = customSearch.trim();
      }

      if (customCategory) {
        params.category = customCategory;
      }

      const response = await axios.get(`${awsConfig.apiBaseUrl}/files`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        params,
      });

      setFiles(response.data.files || []);
      setApiMessage("Files updated successfully.");
    } catch (error) {
      console.error(error);
      setApiMessage(
        `File error: ${error.response?.data?.message || error.message}`
      );
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated) {
      loadCategories();
      loadFiles("");
    }
  }, [auth.isAuthenticated]);

  const createCategory = async () => {
    try {
      if (!categoryName.trim()) {
        setApiMessage("Please enter a category name.");
        return;
      }

      await axios.post(
        `${awsConfig.apiBaseUrl}/categories`,
        { categoryName: categoryName.trim() },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      setCategoryName("");
      setApiMessage("Category created successfully.");
      await loadCategories();
    } catch (error) {
      console.error(error);
      setApiMessage(
        `Create category error: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const deleteCategory = async (categoryId, categoryName) => {
    try {
      const confirmDelete = window.confirm(
        `Delete category "${categoryName}"?\n\nThis will remove the category label. Existing files will not be deleted.`
      );

      if (!confirmDelete) return;

      await axios.delete(`${awsConfig.apiBaseUrl}/categories/${categoryId}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      setApiMessage("Category deleted successfully.");
      await loadCategories();
    } catch (error) {
      console.error(error);
      setApiMessage(
        `Delete category error: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const uploadFile = async () => {
    try {
      if (!selectedFile) {
        setApiMessage("Please choose a file first.");
        return;
      }

      if (!selectedCategory) {
        setApiMessage("Please select a category first.");
        return;
      }

      setApiMessage("Preparing secure upload...");

      const uploadUrlResponse = await axios.post(
        `${awsConfig.apiBaseUrl}/upload-url`,
        {
          fileName: selectedFile.name,
          fileType: selectedFile.type || "application/octet-stream",
          category: selectedCategory,
          size: selectedFile.size,
        },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      const { uploadUrl } = uploadUrlResponse.data;

      setApiMessage("Uploading file...");

      await axios.put(uploadUrl, selectedFile, {
        headers: {
          "Content-Type": selectedFile.type || "application/octet-stream",
        },
      });

      setSelectedFile(null);
      setApiMessage("File uploaded successfully.");
      await loadFiles("");
    } catch (error) {
      console.error(error);
      setApiMessage(
        `Upload error: ${error.response?.data?.message || error.message}`
      );
    }
  };

  const downloadFile = async (fileId) => {
    try {
      setApiMessage("Preparing download...");

      const response = await axios.get(
        `${awsConfig.apiBaseUrl}/download-url/${fileId}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      window.open(response.data.downloadUrl, "_blank");
      setApiMessage("Download started.");
    } catch (error) {
      console.error(error);
      setApiMessage(
        `Download error: ${error.response?.data?.message || error.message}`
      );
    }
  };

  const deleteFile = async (fileId) => {
    try {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this file?"
      );

      if (!confirmDelete) return;

      await axios.delete(`${awsConfig.apiBaseUrl}/files/${fileId}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      setApiMessage("File deleted successfully.");
      await loadFiles("");
    } catch (error) {
      console.error(error);
      setApiMessage(
        `Delete error: ${error.response?.data?.message || error.message}`
      );
    }
  };

  const clearSearch = async () => {
    setSearchTerm("");
    setFileCategoryFilter("");
    await loadFiles("", "");
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";

    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;

    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const totalStorage = useMemo(() => {
    return files.reduce((total, file) => total + Number(file.size || 0), 0);
  }, [files]);

  const displayName = auth.user?.profile?.email?.split("@")[0] || "User";

  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading CloudVault...</p>
        </div>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-slate-900 border border-red-500/40 rounded-3xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold mb-2">CloudVault</h1>
          <p className="text-red-300 mb-6">{auth.error.message}</p>

          <button
            onClick={() => auth.signinRedirect()}
            className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold py-3 rounded-2xl transition"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.22),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.18),_transparent_35%)]"></div>

        <div className="relative min-h-screen flex items-center justify-center px-6">
          <div className="max-w-5xl w-full grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 text-sm mb-6">
                AWS Serverless Portfolio Project
              </div>

              <h1 className="text-6xl font-black tracking-tight mb-6">
                Cloud<span className="text-cyan-400">Vault</span>
              </h1>

              <p className="text-slate-300 text-lg leading-8 mb-8 max-w-xl">
                A secure personal cloud drive built with React, Cognito, API
                Gateway, Lambda, DynamoDB, and S3.
              </p>

              <button
                onClick={() => auth.signinRedirect()}
                className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold px-8 py-4 rounded-2xl shadow-lg shadow-cyan-500/20 transition"
              >
                Sign in to CloudVault
              </button>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-[2rem] p-6 shadow-2xl">
              <div className="grid grid-cols-2 gap-4">
                {[
                  "Private files",
                  "Secure login",
                  "S3 storage",
                  "Serverless APIs",
                  "File metadata",
                  "Search & manage",
                ].map((item) => (
                  <div
                    key={item}
                    className="bg-slate-950/80 border border-white/10 rounded-3xl p-5"
                  >
                    <div className="h-10 w-10 rounded-2xl bg-cyan-400/10 text-cyan-300 flex items-center justify-center mb-4">
                      ✓
                    </div>
                    <p className="font-semibold">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Cloud<span className="text-cyan-400">Vault</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Your private serverless cloud drive
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm text-slate-300">Signed in as</p>
              <p className="font-semibold">{auth.user?.profile?.email}</p>
            </div>

            <button
              onClick={signOutRedirect}
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-semibold transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <section className="mb-8 rounded-[2rem] bg-gradient-to-r from-cyan-500/15 via-slate-900 to-purple-500/10 border border-white/10 p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-cyan-300 text-sm font-semibold mb-2">
                Welcome back
              </p>
              <h2 className="text-4xl font-black mb-3">
                Hi, {displayName}
              </h2>
              <p className="text-slate-300 max-w-2xl">
                Upload, organize, search, download, and delete your private
                files securely using AWS serverless services.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 min-w-full lg:min-w-[420px]">
              <div className="rounded-3xl bg-slate-950/70 border border-white/10 p-5">
                <p className="text-slate-400 text-sm">Files</p>
                <p className="text-3xl font-black mt-2">{files.length}</p>
              </div>

              <div className="rounded-3xl bg-slate-950/70 border border-white/10 p-5">
                <p className="text-slate-400 text-sm">Categories</p>
                <p className="text-3xl font-black mt-2">
                  {categories.length}
                </p>
              </div>

              <div className="rounded-3xl bg-slate-950/70 border border-white/10 p-5">
                <p className="text-slate-400 text-sm">Storage</p>
                <p className="text-2xl font-black mt-2">
                  {formatFileSize(totalStorage)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {apiMessage && (
          <div className="mb-8 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 px-5 py-4 text-cyan-200">
            {apiMessage}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <section className="rounded-[2rem] bg-slate-900 border border-white/10 p-6 shadow-xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black">Folders</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Organize your files
                </p>
              </div>

              <button
                onClick={loadCategories}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm transition"
              >
                Refresh
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Create folder"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 placeholder:text-slate-600"
              />

              <button
                onClick={createCategory}
                className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold px-5 py-3 rounded-2xl transition"
              >
                Add
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-auto pr-1">
              {categories.length === 0 ? (
                <div className="rounded-2xl bg-slate-950 border border-white/10 p-5 text-slate-500 text-sm">
                  No folders yet. Create one to start uploading files.
                </div>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.categoryId}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950 border border-white/10 p-4 hover:border-cyan-400/30 transition"
                  >
                    <div>
                      <p className="font-bold">{category.categoryName}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(category.createdAt)}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        deleteCategory(
                          category.categoryId,
                          category.categoryName
                        )
                      }
                      className="text-red-300 hover:text-red-200 text-sm font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="lg:col-span-2 rounded-[2rem] bg-slate-900 border border-white/10 p-6 shadow-xl">
            <div className="mb-6">
              <h3 className="text-2xl font-black">Upload</h3>
              <p className="text-sm text-slate-400 mt-1">
                Files are uploaded directly to Amazon S3 using secure temporary
                URLs.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  File
                </label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="block w-full text-sm text-slate-300 file:mr-4 file:py-3 file:px-4 file:rounded-2xl file:border-0 file:bg-cyan-400 file:text-slate-950 file:font-bold hover:file:bg-cyan-300"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Folder
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400"
                >
                  <option value="">Select folder</option>
                  {categories.map((category) => (
                    <option
                      key={category.categoryId}
                      value={category.categoryName}
                    >
                      {category.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={uploadFile}
                className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black px-6 py-3 rounded-2xl transition shadow-lg shadow-cyan-500/20"
              >
                Upload File
              </button>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-[2rem] bg-slate-900 border border-white/10 p-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-2xl font-black">My Files</h3>
              <p className="text-sm text-slate-400 mt-1">
                Search, download, and manage your uploaded files.
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-2">
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 w-full lg:w-64 placeholder:text-slate-600"
              />

              <select
                value={fileCategoryFilter}
                onChange={(e) => setFileCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 w-full lg:w-56"
              >
                <option value="">All folders</option>
                {categories.map((category) => (
                  <option key={category.categoryId} value={category.categoryName}>
                    {category.categoryName}
                  </option>
                ))}
              </select>

              <button
                onClick={() => loadFiles(searchTerm, fileCategoryFilter)}
                className="bg-slate-800 hover:bg-slate-700 border border-white/10 px-5 py-3 rounded-2xl transition font-semibold"
              >
                Apply
              </button>

              <button
                onClick={clearSearch}
                className="bg-slate-800 hover:bg-slate-700 border border-white/10 px-5 py-3 rounded-2xl transition font-semibold"
              >
                Clear
              </button>
            </div>
          </div>

          {files.length === 0 ? (
            <div className="rounded-3xl bg-slate-950 border border-white/10 p-12 text-center">
              <div className="h-16 w-16 rounded-3xl bg-cyan-400/10 text-cyan-300 flex items-center justify-center mx-auto mb-4 text-2xl">
                ☁
              </div>
              <p className="text-slate-300 font-semibold">No files found</p>
              <p className="text-slate-500 text-sm mt-1">
                Upload a file or refresh your file list.
              </p>
            </div>
          ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <div
              key={file.fileId}
              className="rounded-3xl bg-slate-950 border border-white/10 p-5 hover:border-cyan-400/40 transition"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="mb-4 h-44 w-full overflow-hidden rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center">
                  {file.fileType?.startsWith("image/") && file.previewUrl ? (
                    <img
                      src={file.previewUrl}
                      alt={file.fileName}
                      className="h-full w-full object-cover"
                    />
                  ) : file.fileType?.includes("pdf") ||
                    file.fileName?.toLowerCase().endsWith(".pdf") ? (
                    file.previewUrl ? (
                      <iframe
                        src={file.previewUrl}
                        title={file.fileName}
                        className="h-full w-full bg-white"
                      />
                    ) : (
                      <div className="text-center px-4">
                        <div className="text-5xl mb-2">📄</div>
                        <p className="text-sm text-slate-300 font-semibold">PDF Document</p>
                        <p className="text-xs text-slate-500 mt-1 truncate max-w-[180px]">
                          {file.fileName}
                        </p>
                      </div>
                    )
                  ) : file.fileType?.includes("word") ||
                    file.fileType?.includes("msword") ||
                    file.fileName?.toLowerCase().endsWith(".doc") ||
                    file.fileName?.toLowerCase().endsWith(".docx") ? (
                    <div className="h-full w-full bg-gradient-to-br from-blue-500/20 to-slate-950 flex flex-col items-center justify-center px-4">
                      <div className="text-5xl mb-3">📝</div>
                      <p className="text-sm text-slate-200 font-bold">Word Document</p>
                      <p className="text-xs text-slate-500 mt-2 truncate max-w-[200px]">
                        {file.fileName}
                      </p>
                    </div>
                  ) : file.fileType?.includes("spreadsheet") ||
                    file.fileType?.includes("excel") ||
                    file.fileName?.toLowerCase().endsWith(".xls") ||
                    file.fileName?.toLowerCase().endsWith(".xlsx") ||
                    file.fileName?.toLowerCase().endsWith(".csv") ? (
                    <div className="h-full w-full bg-gradient-to-br from-emerald-500/20 to-slate-950 flex flex-col items-center justify-center px-4">
                      <div className="text-5xl mb-3">📊</div>
                      <p className="text-sm text-slate-200 font-bold">Spreadsheet</p>
                      <p className="text-xs text-slate-500 mt-2 truncate max-w-[200px]">
                        {file.fileName}
                      </p>
                    </div>
                  ) : file.fileName?.toLowerCase().endsWith(".ppt") ||
                    file.fileName?.toLowerCase().endsWith(".pptx") ? (
                    <div className="h-full w-full bg-gradient-to-br from-orange-500/20 to-slate-950 flex flex-col items-center justify-center px-4">
                      <div className="text-5xl mb-3">📽️</div>
                      <p className="text-sm text-slate-200 font-bold">Presentation</p>
                      <p className="text-xs text-slate-500 mt-2 truncate max-w-[200px]">
                        {file.fileName}
                      </p>
                    </div>
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-slate-700/30 to-slate-950 flex flex-col items-center justify-center px-4">
                      <div className="text-5xl mb-3">📁</div>
                      <p className="text-sm text-slate-200 font-bold">File</p>
                      <p className="text-xs text-slate-500 mt-2 truncate max-w-[200px]">
                        {file.fileName}
                      </p>
                    </div>
                  )}
                </div>

                <span className="px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-300 text-xs font-semibold">
                  {file.category}
                </span>
              </div>

              <h4 className="font-bold text-slate-100 truncate mb-1">
                {file.fileName}
              </h4>

              <p className="text-xs text-slate-500 mb-4 truncate">
                {file.fileType}
              </p>

              <div className="grid grid-cols-2 gap-3 text-sm mb-5">
                <div className="rounded-2xl bg-slate-900 border border-white/10 p-3">
                  <p className="text-slate-500 text-xs">Size</p>
                  <p className="font-semibold">{formatFileSize(file.size)}</p>
                </div>

                <div className="rounded-2xl bg-slate-900 border border-white/10 p-3">
                  <p className="text-slate-500 text-xs">Uploaded</p>
                  <p className="font-semibold">{formatDate(file.createdAt)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => downloadFile(file.fileId)}
                  className="flex-1 px-4 py-2 rounded-xl bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20 text-sm font-semibold"
                >
                  Download
                </button>

                <button
                  onClick={() => deleteFile(file.fileId)}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-400/10 text-red-300 hover:bg-red-400/20 text-sm font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;