/**
 * SharePoint view — Teams/OneDrive-style file browser.
 * Table layout: Name, Modified, Modified By, Sharing, Size.
 * Hover on Modified shows exact timestamp. Uses LoadingSpinner components.
 * Server-side search via Graph API. Fully i18n.
 */

import { useState, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useSharePointSites,
  useSharePointFiles,
  useSharePointSearch,
  useShareSharePointItem,
  useUploadSharePointFile,
  useDeleteSharePointItem
} from '../../hooks/queries/microsoft';
import { toast } from '../../store/notification';
import type { OneDriveItem, SharePointSite } from '../../types';
import {
  DocumentIcon,
  FolderIcon,
  ExternalLinkIcon,
  ShareIcon,
  GlobeIcon,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  SpreadsheetIcon,
  PresentationIcon,
  ZipIcon,
  TrashIcon,
  PlusIcon,
  SearchIcon,
  ChevronRightIcon,
  UsersIcon
} from '../ui/Icons';
import LoadingSpinner, { LoadingState } from '../ui/LoadingSpinner';

// ─── Helpers ─────────────────────────────────────────────────────────────────

type TFunc = (key: string, opts?: Record<string, unknown>) => string;

function getFileIcon(name: string, mimeType?: string): ReactNode {
  if (!mimeType)
    return <DocumentIcon size="sm" className="text-boxflow-muted" />;
  if (mimeType.startsWith('image/'))
    return <ImageIcon size="sm" className="text-purple-400" />;
  if (mimeType.startsWith('video/'))
    return <VideoIcon size="sm" className="text-pink-400" />;
  if (mimeType.startsWith('audio/'))
    return <MusicIcon size="sm" className="text-yellow-400" />;
  if (mimeType.includes('pdf'))
    return <DocumentIcon size="sm" className="text-red-500" />;
  if (
    mimeType.includes('word') ||
    mimeType.includes('document') ||
    name.endsWith('.docx') ||
    name.endsWith('.doc')
  )
    return <DocumentIcon size="sm" className="text-blue-500" />;
  if (
    mimeType.includes('sheet') ||
    mimeType.includes('excel') ||
    name.endsWith('.xlsx') ||
    name.endsWith('.xls')
  )
    return <SpreadsheetIcon size="sm" className="text-green-600" />;
  if (
    mimeType.includes('presentation') ||
    mimeType.includes('powerpoint') ||
    name.endsWith('.pptx')
  )
    return <PresentationIcon size="sm" className="text-orange-500" />;
  if (
    mimeType.includes('zip') ||
    mimeType.includes('compressed') ||
    mimeType.includes('rar')
  )
    return <ZipIcon size="sm" className="text-yellow-500" />;
  if (
    mimeType.includes('text') ||
    mimeType.includes('json') ||
    mimeType.includes('xml')
  )
    return <DocumentIcon size="sm" className="text-gray-400" />;
  return <DocumentIcon size="sm" className="text-boxflow-muted" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatRelativeDate(dateStr: string, t: TFunc): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return t('microsoft.justNow');
  if (diffMin < 60) return t('microsoft.minutesAgo', { count: diffMin });
  if (diffHours < 24) return t('microsoft.hoursAgo', { count: diffHours });
  if (diffDays < 7) return t('microsoft.daysAgo', { count: diffDays });
  return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

function formatExactDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// ─── Sort ────────────────────────────────────────────────────────────────────

type SortField = 'name' | 'lastModifiedDateTime' | 'size';
type SortDir = 'asc' | 'desc';

function sortItems(
  items: OneDriveItem[],
  field: SortField,
  dir: SortDir
): OneDriveItem[] {
  const folders = items.filter((i) => i.folder);
  const files = items.filter((i) => !i.folder);

  const compare = (a: OneDriveItem, b: OneDriveItem): number => {
    let result = 0;
    if (field === 'name') {
      result = a.name.localeCompare(b.name, 'sv-SE', { sensitivity: 'base' });
    } else if (field === 'lastModifiedDateTime') {
      result =
        new Date(a.lastModifiedDateTime).getTime() -
        new Date(b.lastModifiedDateTime).getTime();
    } else if (field === 'size') {
      result = a.size - b.size;
    }
    return dir === 'desc' ? -result : result;
  };

  return [...folders.sort(compare), ...files.sort(compare)];
}

// ─── SortHeader ──────────────────────────────────────────────────────────────

function SortHeader({
  label,
  field,
  currentField,
  currentDir,
  onSort,
  className = ''
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  currentDir: SortDir;
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const active = currentField === field;
  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wide ${
        active ? 'text-white' : 'text-boxflow-muted hover:text-white'
      } transition-colors ${className}`}
    >
      {label}
      {active && (
        <span className="text-[10px]">{currentDir === 'asc' ? '▲' : '▼'}</span>
      )}
    </button>
  );
}

// ─── Mini avatar ─────────────────────────────────────────────────────────────

function MiniAvatar({ name }: { name: string }) {
  return (
    <div
      className="w-6 h-6 rounded-full bg-boxflow-hover flex items-center justify-center text-[10px] font-medium text-boxflow-muted flex-shrink-0"
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}

// ─── File row (table style) ──────────────────────────────────────────────────

function FileTableRow({
  item,
  onNavigate,
  onShare,
  onDelete,
  isDeleting,
  t
}: {
  item: OneDriveItem;
  onNavigate?: () => void;
  onShare: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  t: TFunc;
}) {
  const isFolder = !!item.folder;
  const modifiedBy = item.lastModifiedBy?.user?.displayName;

  return (
    <div className="grid grid-cols-[1fr_140px_160px_80px_80px] items-center px-4 py-2 hover:bg-boxflow-hover/30 transition-colors group border-b border-boxflow-hover-50/50 last:border-b-0">
      {/* Name */}
      <div
        className={`flex items-center gap-3 min-w-0 ${onNavigate ? 'cursor-pointer' : ''}`}
        onClick={onNavigate}
      >
        <span className="flex-shrink-0">
          {isFolder ? (
            <FolderIcon size="sm" className="text-yellow-400" />
          ) : (
            getFileIcon(item.name, item.file?.mimeType)
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-white truncate leading-tight">
            {item.name}
          </p>
          {isFolder && (
            <p className="text-[11px] text-boxflow-muted">
              {item.folder?.childCount ?? 0} {t('microsoft.objects')}
            </p>
          )}
        </div>
        {/* Hover actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {!isFolder && (
            <a
              href={item.webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-boxflow-muted hover:text-white rounded transition-colors"
              title={t('microsoft.openInBrowser')}
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLinkIcon size="sm" />
            </a>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="p-1.5 text-boxflow-muted hover:text-blue-400 rounded transition-colors"
            title={t('microsoft.copyShareLink')}
          >
            <ShareIcon size="sm" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 text-boxflow-muted hover:text-red-400 rounded transition-colors"
            title={t('microsoft.delete')}
            disabled={isDeleting}
          >
            <TrashIcon size="sm" />
          </button>
        </div>
      </div>

      {/* Modified date — hover shows exact time */}
      <span
        className="text-xs text-boxflow-muted truncate cursor-default"
        title={formatExactDate(item.lastModifiedDateTime)}
      >
        {formatRelativeDate(item.lastModifiedDateTime, t)}
      </span>

      {/* Modified by */}
      <div className="flex items-center gap-2 min-w-0">
        {modifiedBy ? (
          <>
            <MiniAvatar name={modifiedBy} />
            <span className="text-xs text-boxflow-muted truncate">
              {modifiedBy}
            </span>
          </>
        ) : (
          <span className="text-xs text-boxflow-muted">—</span>
        )}
      </div>

      {/* Sharing — icon indicator */}
      <div className="flex items-center justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
          className="p-1 text-boxflow-muted hover:text-blue-400 rounded transition-colors"
          title={t('microsoft.share')}
        >
          <UsersIcon size="sm" />
        </button>
      </div>

      {/* Size */}
      <span className="text-xs text-boxflow-muted text-right">
        {isFolder ? '—' : formatFileSize(item.size)}
      </span>
    </div>
  );
}

// ─── Delete confirm ──────────────────────────────────────────────────────────

function DeleteConfirm({
  item,
  onConfirm,
  onCancel,
  isPending,
  t
}: {
  item: OneDriveItem;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
  t: TFunc;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-boxflow-darker rounded-lg border border-boxflow-hover-50 p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-semibold mb-2">
          {t('microsoft.deleteConfirm')}
        </h3>
        <p
          className="text-boxflow-muted text-sm mb-4"
          dangerouslySetInnerHTML={{
            __html: item.folder
              ? t('microsoft.deleteFolderConfirm', { name: item.name })
              : t('microsoft.deleteFileConfirm', { name: item.name })
          }}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-boxflow-muted hover:text-white transition-colors"
          >
            {t('microsoft.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          >
            {isPending ? (
              <>
                <LoadingSpinner size="sm" centered={false} />
                {t('microsoft.deleting')}
              </>
            ) : (
              t('microsoft.delete')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface SharePointViewProps {
  /** When provided, skip the site picker and go straight to this site's files */
  fixedSiteId?: string;
  fixedSiteName?: string;
}

export function SharePointView({
  fixedSiteId,
  fixedSiteName
}: SharePointViewProps = {}) {
  const { t } = useTranslation();
  const [selectedSite, setSelectedSite] = useState<SharePointSite | null>(
    fixedSiteId
      ? ({
          id: fixedSiteId,
          displayName: fixedSiteName || 'SharePoint',
          webUrl: ''
        } as SharePointSite)
      : null
  );
  const [folderId, setFolderId] = useState<string | undefined>();
  const [folderStack, setFolderStack] = useState<
    { id?: string; name: string }[]
  >(fixedSiteId ? [{ name: fixedSiteName || 'SharePoint' }] : []);
  const [sortField, setSortField] = useState<SortField>('lastModifiedDateTime');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<OneDriveItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSearching = searchQuery.length >= 2;

  const {
    data: sites,
    isLoading: sitesLoading,
    error: sitesError
  } = useSharePointSites(!selectedSite && !fixedSiteId);
  const {
    data: files,
    isLoading: filesLoading,
    error: filesError
  } = useSharePointFiles(
    selectedSite?.id ?? '',
    folderId,
    !!selectedSite && !isSearching
  );
  const { data: searchResults, isLoading: searchLoading } = useSharePointSearch(
    selectedSite?.id ?? '',
    searchQuery,
    !!selectedSite && isSearching
  );
  const shareItem = useShareSharePointItem();
  const uploadFile = useUploadSharePointFile();
  const deleteItem = useDeleteSharePointItem();

  const selectSite = (site: SharePointSite) => {
    setSelectedSite(site);
    setFolderId(undefined);
    setFolderStack([{ name: site.displayName }]);
    setSearchQuery('');
  };

  const navigateToFolder = (item: OneDriveItem) => {
    setFolderId(item.id);
    setFolderStack((prev) => [...prev, { id: item.id, name: item.name }]);
    setSearchQuery('');
  };

  const navigateBack = (index: number) => {
    if (index === -1) {
      // When in fixed-site mode (channel view), don't go back to site list
      if (fixedSiteId) {
        setFolderId(undefined);
        setFolderStack([{ name: fixedSiteName || 'SharePoint' }]);
        setSearchQuery('');
        return;
      }
      setSelectedSite(null);
      setFolderId(undefined);
      setFolderStack([]);
      setSearchQuery('');
      return;
    }
    const target = folderStack[index];
    setFolderId(target.id);
    setFolderStack((prev) => prev.slice(0, index + 1));
  };

  const handleShare = (item: OneDriveItem) => {
    if (!selectedSite) return;
    shareItem.mutate(
      { siteId: selectedSite.id, itemId: item.id },
      {
        onSuccess: (data) => {
          navigator.clipboard.writeText(data.url);
          toast.success(t('microsoft.linkCopied', { name: item.name }));
        },
        onError: () => toast.error(t('microsoft.shareLinkError'))
      }
    );
  };

  const handleUpload = () => fileInputRef.current?.click();

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSite) return;
    uploadFile.mutate(
      { siteId: selectedSite.id, file, folderId },
      {
        onSuccess: (data) =>
          toast.success(t('microsoft.uploaded', { name: data.name })),
        onError: () => toast.error(t('microsoft.uploadError'))
      }
    );
    e.target.value = '';
  };

  const handleDelete = () => {
    if (!deleteTarget || !selectedSite) return;
    deleteItem.mutate(
      { siteId: selectedSite.id, itemId: deleteTarget.id },
      {
        onSuccess: () => {
          toast.success(t('microsoft.deleted', { name: deleteTarget.name }));
          setDeleteTarget(null);
        },
        onError: () => {
          toast.error(t('microsoft.deleteError'));
          setDeleteTarget(null);
        }
      }
    );
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'name' ? 'asc' : 'desc');
    }
  };

  const displayItems = (() => {
    const items = isSearching
      ? (searchResults?.value ?? [])
      : (files?.value ?? []);
    return sortItems(items, sortField, sortDir);
  })();

  const isLoadingFiles = isSearching ? searchLoading : filesLoading;

  return (
    <div className="max-w-5xl mx-auto space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Header with breadcrumbs + actions */}
      {selectedSite && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 text-sm overflow-x-auto flex-1 min-w-0">
            {!isSearching ? (
              <>
                <button
                  onClick={() => navigateBack(-1)}
                  className="text-boxflow-muted hover:text-white transition-colors flex-shrink-0"
                >
                  {t('microsoft.sharePoint')}
                </button>
                {folderStack.map((folder, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 flex-shrink-0"
                  >
                    <ChevronRightIcon
                      size="sm"
                      className="text-boxflow-muted"
                    />
                    <button
                      onClick={() => navigateBack(i)}
                      className={
                        i === folderStack.length - 1
                          ? 'text-white font-medium'
                          : 'text-boxflow-muted hover:text-white transition-colors'
                      }
                    >
                      {folder.name}
                    </button>
                  </span>
                ))}
              </>
            ) : (
              <span className="text-boxflow-muted">
                {t('microsoft.searchResultsFor', { query: searchQuery })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <SearchIcon
                size="sm"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-boxflow-muted"
              />
              <input
                type="text"
                placeholder={t('microsoft.searchFiles')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-44 pl-8 pr-3 py-1.5 text-sm bg-boxflow-dark border border-boxflow-hover-50 rounded text-white placeholder-boxflow-muted focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={uploadFile.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
            >
              {uploadFile.isPending ? (
                <>
                  <LoadingSpinner size="sm" centered={false} />
                  {t('microsoft.uploading')}
                </>
              ) : (
                <>
                  <PlusIcon size="sm" />
                  {t('microsoft.upload')}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="bg-boxflow-darker rounded-lg border border-boxflow-hover-50 overflow-hidden">
        {/* Sites list */}
        {!selectedSite && (
          <>
            <div className="px-4 py-3 border-b border-boxflow-hover-50">
              <h3 className="text-sm font-medium text-white">
                {t('microsoft.yourSharePointSites')}
              </h3>
            </div>
            {sitesError ? (
              <div className="p-12 text-center">
                <GlobeIcon
                  size="md"
                  className="text-boxflow-muted mx-auto mb-3"
                />
                <p className="text-red-400 text-sm">
                  {t('microsoft.couldNotLoadSharePoint')}
                </p>
                <p className="text-boxflow-muted text-xs mt-1">
                  {t('microsoft.sessionExpired')}
                </p>
              </div>
            ) : sitesLoading ? (
              <div className="py-12">
                <LoadingState text={t('microsoft.loadingSites')} size="md" />
              </div>
            ) : !sites?.value?.length ? (
              <div className="p-12 text-center">
                <GlobeIcon
                  size="md"
                  className="text-boxflow-muted mx-auto mb-3"
                />
                <p className="text-boxflow-muted text-sm">
                  {t('microsoft.noSharePointSites')}
                </p>
                <p className="text-boxflow-muted text-xs mt-1">
                  {t('microsoft.noSharePointSitesHint')}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-boxflow-hover-50/50">
                {sites.value.map((site) => (
                  <div
                    key={site.id}
                    onClick={() => selectSite(site)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-boxflow-hover/30 transition-colors cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                      <GlobeIcon size="sm" className="text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate font-medium">
                        {site.displayName}
                      </p>
                      {site.description && (
                        <p className="text-xs text-boxflow-muted truncate">
                          {site.description}
                        </p>
                      )}
                    </div>
                    <ChevronRightIcon
                      size="sm"
                      className="text-boxflow-muted opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Files table */}
        {selectedSite && (
          <>
            {filesError && !isSearching ? (
              <div className="p-12 text-center">
                <p className="text-red-400 text-sm">
                  {t('microsoft.couldNotLoadFiles')}
                </p>
                <p className="text-boxflow-muted text-xs mt-1">
                  {t('microsoft.sessionExpired')}
                </p>
              </div>
            ) : isLoadingFiles ? (
              <div className="py-12">
                <LoadingState text={t('microsoft.loadingFiles')} size="md" />
              </div>
            ) : !displayItems.length ? (
              <div className="p-12 text-center">
                <FolderIcon
                  size="md"
                  className="text-boxflow-muted mx-auto mb-3"
                />
                <p className="text-boxflow-muted text-sm">
                  {isSearching
                    ? t('microsoft.noFilesMatch')
                    : t('microsoft.emptyFolder')}
                </p>
                {!isSearching && (
                  <button
                    onClick={handleUpload}
                    className="mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {t('microsoft.uploadFile')}
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Table header */}
                <div className="grid grid-cols-[1fr_140px_160px_80px_80px] items-center px-4 py-2 border-b border-boxflow-hover-50 bg-boxflow-dark/50">
                  <SortHeader
                    label={t('microsoft.colName')}
                    field="name"
                    currentField={sortField}
                    currentDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortHeader
                    label={t('microsoft.colModified')}
                    field="lastModifiedDateTime"
                    currentField={sortField}
                    currentDir={sortDir}
                    onSort={handleSort}
                  />
                  <span className="text-xs font-medium uppercase tracking-wide text-boxflow-muted">
                    {t('microsoft.colModifiedBy')}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wide text-boxflow-muted text-center">
                    {t('microsoft.colSharing')}
                  </span>
                  <SortHeader
                    label={t('microsoft.colSize')}
                    field="size"
                    currentField={sortField}
                    currentDir={sortDir}
                    onSort={handleSort}
                    className="justify-end"
                  />
                </div>

                {/* File rows */}
                <div className="max-h-[calc(100vh-240px)] overflow-y-auto">
                  {displayItems.map((item) => (
                    <FileTableRow
                      key={item.id}
                      item={item}
                      onNavigate={
                        item.folder ? () => navigateToFolder(item) : undefined
                      }
                      onShare={() => handleShare(item)}
                      onDelete={() => setDeleteTarget(item)}
                      isDeleting={deleteItem.isPending}
                      t={t}
                    />
                  ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-boxflow-hover-50 bg-boxflow-dark/30">
                  <span className="text-xs text-boxflow-muted">
                    {isSearching
                      ? t('microsoft.itemsSearch', {
                          count: displayItems.length
                        })
                      : t('microsoft.items', { count: displayItems.length })}
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteConfirm
          item={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isPending={deleteItem.isPending}
          t={t}
        />
      )}
    </div>
  );
}
