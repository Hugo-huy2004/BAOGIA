import React from "react";
import { 
  FolderOpen, Folder, Plus, Edit2, Trash2, 
  ChevronDown, ChevronRight, FileCode 
} from "lucide-react";

export default function FileExplorerSidebar({
  workspaceTree,
  activeTabPath,
  expandedFolders,
  setExpandedFolders,
  inlineAction,
  setInlineAction,
  inputRef,
  dirHandle,
  toggleFolder,
  handleOpenFile,
  getFileIcon,
  handleInlineInputKeyDown,
  handleInlineInputBlur,
  handleDeleteEntry,
  getActiveFolder
}) {
  const renderTree = (node, level = 0) => {
    if (!node) return null;
    const sortedChildren = [...(node.children || [])].sort((a, b) => {
      if (!a || !b) return 0;
      const aType = a.type || "file";
      const bType = b.type || "file";
      if (aType !== bType) {
        return aType === "folder" ? -1 : 1;
      }
      const aName = a.name || "";
      const bName = b.name || "";
      return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' });
    });
    return (
      <div key={node.path || "root"} className="space-y-0.5 font-sans">
        {node.path && (
          <div
            style={{ paddingLeft: `${level * 12 + 4}px` }}
            className={`group flex items-center justify-between py-1 px-2 rounded cursor-pointer transition-colors ${
              node.type === "folder"
                ? "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                : activeTabPath === node.path
                ? "bg-primary/20 text-primary border-l-2 border-primary font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
            onClick={() => {
              if (node.type === "folder") {
                toggleFolder(node.path);
              } else {
                handleOpenFile(node.path);
              }
            }}
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {node.type === "folder" ? (
                <>
                  <span className="text-muted-foreground w-3 flex items-center justify-center">
                    {expandedFolders[node.path] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </span>
                  {expandedFolders[node.path] ? (
                    <FolderOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  )}
                </>
              ) : (
                <>
                  <span className="w-3" />
                  {getFileIcon(node.name)}
                </>
              )}

              {/* Name string or inline rename input */}
              {inlineAction && inlineAction.type === "rename" && inlineAction.targetPath === node.path ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={inlineAction.value}
                  onChange={(e) => setInlineAction({ ...inlineAction, value: e.target.value })}
                  onKeyDown={(e) => handleInlineInputKeyDown(e, inlineAction)}
                  onBlur={() => handleInlineInputBlur(inlineAction)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-muted text-foreground border border-primary rounded px-1 py-0.5 text-[11px] outline-none w-full font-mono"
                />
              ) : (
                <span className="truncate select-none text-[11.5px] font-medium">{node.name}</span>
              )}
            </div>

            {/* Hover Operations */}
            {(!inlineAction || inlineAction.targetPath !== node.path) && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                {node.type === "folder" && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!expandedFolders[node.path]) {
                          setExpandedFolders(prev => ({ ...prev, [node.path]: true }));
                        }
                        setInlineAction({ type: "new_file", parentPath: node.path, value: "" });
                      }}
                      className="p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-white"
                      title="New File..."
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!expandedFolders[node.path]) {
                          setExpandedFolders(prev => ({ ...prev, [node.path]: true }));
                        }
                        setInlineAction({ type: "new_folder", parentPath: node.path, value: "" });
                      }}
                      className="p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-white"
                      title="New Folder..."
                    >
                      <Folder className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setInlineAction({ type: "rename", targetPath: node.path, oldName: node.name, value: node.name });
                  }}
                  className="p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-white"
                  title="Rename"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEntry(node.path, node.type);
                  }}
                  className="p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-destructive"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Folder Children rendering */}
        {(node.path === "" || (node.type === "folder" && expandedFolders[node.path])) && (
          <div className="space-y-0.5">
            {/* Render new creation input at the top of the children list if child target matches this parent path */}
            {inlineAction && (inlineAction.type === "new_file" || inlineAction.type === "new_folder") && inlineAction.parentPath === node.path && (
              <div
                style={{ paddingLeft: `${(level + (node.path === "" ? 0 : 1)) * 12 + 4}px` }}
                className="flex items-center gap-1.5 py-1 px-2 hover:bg-muted/50 rounded"
              >
                <span className="w-3" />
                {inlineAction.type === "new_folder" ? (
                  <Folder className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                ) : (
                  <FileCode className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={inlineAction.value}
                  placeholder={inlineAction.type === "new_folder" ? "New folder..." : "New file..."}
                  onChange={(e) => setInlineAction({ ...inlineAction, value: e.target.value })}
                  onKeyDown={(e) => handleInlineInputKeyDown(e, inlineAction)}
                  onBlur={() => handleInlineInputBlur(inlineAction)}
                  className="bg-muted text-foreground border border-primary rounded px-1 py-0.5 text-[11px] outline-none w-full font-mono"
                />
              </div>
            )}

            {sortedChildren.map(child => renderTree(child, node.path === "" ? level : level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 flex-1 flex flex-col overflow-y-auto space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-border pb-2 mb-1">
        <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Thư mục dự án</span>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => {
              const parent = getActiveFolder();
              if (parent) setExpandedFolders(prev => ({ ...prev, [parent]: true }));
              setInlineAction({ type: "new_file", parentPath: parent, value: "" });
            }}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-white transition-colors"
            title="New File..."
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => {
              const parent = getActiveFolder();
              if (parent) setExpandedFolders(prev => ({ ...prev, [parent]: true }));
              setInlineAction({ type: "new_folder", parentPath: parent, value: "" });
            }}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-white transition-colors"
            title="New Folder..."
          >
            <Folder className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recursive File Tree */}
      <div className="space-y-0.5 font-mono text-[11px] select-none">
        {renderTree(workspaceTree)}
      </div>

      {dirHandle && (
        <div className="bg-success/5 border border-success/25 p-3 rounded-lg text-success text-[10px] space-y-1">
          <p className="font-bold flex items-center gap-1"><FolderOpen className="w-4 h-4" /> Thư mục: {dirHandle.name}</p>
          <p className="text-muted-foreground leading-normal">Đồng bộ trực tiếp. Mọi chỉnh sửa được tự động lưu trực tiếp xuống file vật lý khi bạn dừng gõ 1 giây.</p>
        </div>
      )}
    </div>
  );
}
