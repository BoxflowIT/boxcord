# Återanvändbara Komponenter 🧩

Detta är en dokumentation av alla små, återanvändbara komponenter i Boxcord-projektet. Dessa komponenter följer DRY-principen (Don't Repeat Yourself) och gör projektet mycket lättare att underhålla.

## 📁 Struktur

```
client/src/components/
├── message/          # Meddelande-relaterade komponenter (6)
├── channel/          # Kanal-relaterade komponenter (8)
├── sidebar/          # Sidebar-komponenter (4)
├── dm/               # Direktmeddelande-komponenter (2)
├── form/             # Formulär-komponenter (9)
├── layout/           # Layout-komponenter (2)
├── profile/          # Profil-komponenter (6)
├── settings/         # Inställnings-komponenter (5)
├── member/           # Medlemslista-komponenter (5)
├── modal/            # Modal utility-komponenter (3)
├── workspace/        # Workspace-komponenter (4)
├── user/             # Användar-komponenter (2)
├── action/           # Action-komponenter (4)
├── notification/     # Notifikations-komponenter (4)
├── list/             # List utility-komponenter (3)
├── container/        # Container-komponenter (3)
├── avatar/           # Avatar-komponenter (3)
├── menu/             # Menu-komponenter (4)
├── dialog/           # Dialog-komponenter (4)
├── tabs/             # Tab-komponenter (2)
├── scroll/           # Scroll-komponenter (2)
├── utility/          # Utility-komponenter (3)
└── ui/               # Grundläggande UI-komponenter (9+)
```

## 💬 Message Components

### MessageAvatar
Visar användares profilbild eller initialer.
```tsx
<MessageAvatar 
  avatarUrl={user.avatarUrl}
  initial="J"
  userName="John Doe"
  size="md"
/>
```

### MessageHeader
Visar författarnamn, tidsstämpel och "redigerad" badge.
```tsx
<MessageHeader 
  authorName="John Doe"
  createdAt="2026-02-17T10:00:00Z"
  edited={true}
  compact={false}
/>
```

### MessageContent
Visar meddelandetext och bilagor.
```tsx
<MessageContent 
  content="Hello world!"
  attachments={[...]}
  compact={false}
  renderContent={(text) => <span>{text}</span>}
/>
```

### MessageReactionBubbles
Visar reaktionsbubblor under meddelanden.
```tsx
<MessageReactionBubbles 
  reactions={[{ emoji: '👍', count: 5, hasReacted: true }]}
  onToggle={(emoji) => handleReaction(emoji)}
/>
```

### MessageActions
Hover-bar med snabba reaktioner och edit/delete knappar.
```tsx
<MessageActions 
  onQuickReaction={(emoji) => handleReaction(emoji)}
  onEdit={() => handleEdit()}
  onDelete={() => handleDelete()}
  isOwnMessage={true}
/>
```

### MessageEditForm
Formulär för att redigera meddelanden.
```tsx
<MessageEditForm 
  value={editContent}
  onChange={setEditContent}
  onSave={handleSave}
  onCancel={handleCancel}
  textareaRef={ref}
  compact={false}
/>
```

## 📢 Channel Components

### ChannelHeader
Header med kanalnamn och beskrivning.
```tsx
<ChannelHeader 
  channelName="general"
  channelDescription="Allmän diskussion"
  onToggleMemberList={() => setShowMembers(!showMembers)}
/>
```

### MessageList
Container för meddelanden med loading och scroll.
```tsx
<MessageList 
  loading={false}
  messages={messageComponents}
  emptyState={<EmptyState title="Inga meddelanden" />}
  autoScroll={true}
/>
```

### MessageInput
Input-område för att skriva meddelanden.
```tsx
<MessageInput 
  value={input}
  onChange={setInput}
  onSend={handleSend}
  placeholder="Skriv meddelande..."
  onFileSelect={handleFile}
  onEmojiSelect={handleEmoji}
  autoFocus={true}
/>
```

### BotResponse
Visar ephemeral bot-svar.
```tsx
<BotResponse 
  content="Kommandot har körts!"
  isPrivate={true}
  onDismiss={() => setBotResponse(null)}
/>
```

### ChannelIcon
Ikoner för kanaltyper (text/voice/announcement).
```tsx
<ChannelIcon 
  type="text"
  size="md"
/>
```

### UnreadBadge
Badge för olästa meddelanden.
```tsx
<UnreadBadge 
  count={42}
  max={99}
  variant="mention"
  pulse={true}
/>
```

### TypingIndicator
Visar vem som skriver.
```tsx
<TypingIndicator 
  users={['Anna', 'Erik']}
  maxDisplay={3}
/>
```

### ChannelName
Visar kanalnamn med ikon.
```tsx
<ChannelName 
  name="general"
  type="text"
  showIcon={true}
  prefix="#"
/>
```

### MessageComposer
Komplett message input med mentions, slash commands, emojis och file uploads.
```tsx
<MessageComposer 
  channelId="channel-123"
  workspaceId="workspace-456"
  placeholder="Skriv meddelande..."
  onSend={handleSendMessage}
  onTyping={() => socket.emit('typing')}
  onStopTyping={() => socket.emit('stop-typing')}
  onBotResponse={setBotResponse}
/>
```

## 🔖 Sidebar Components

### WorkspaceHeader
Header med workspace-namnet och dropdown.
```tsx
<WorkspaceHeader 
  name="Mitt Team"
  iconUrl="/icon.png"
  onClick={() => setShowMenu(true)}
/>
```

### WorkspaceList
Lista med workspace-ikoner i sidebaren.
```tsx
<WorkspaceList 
  workspaces={workspaces}
  currentWorkspaceId={currentId}
  onSelectWorkspace={handleSelect}
  onCreateWorkspace={() => setShowCreate(true)}
  onGoHome={() => navigate('/')}
/>
```

### ChannelListItem
Ett kanal-item i listan.
```tsx
<ChannelListItem 
  id="channel-1"
  name="general"
  isActive={true}
  unreadCount={5}
  onClick={() => selectChannel('channel-1')}
  onEdit={() => setEditChannel('channel-1')}
/>
```

### SectionHeader
Header för sektioner med + knapp.
```tsx
<SectionHeader 
  title="Textkanaler"
  onAdd={() => setShowNewChannel(true)}
  addTitle="Ny kanal"
/>
```

## 💌 DM Components

### DMChannelItem
Ett DM-item i listan.
```tsx
<DMChannelItem 
  id="dm-1"
  userName="John Doe"
  userInitial="J"
  avatarUrl="/avatar.jpg"
  isActive={true}
  unreadCount={2}
  isOnline={true}
  onClick={() => selectDM('dm-1')}
/>
```

### DMHeader
Header för DM-konversationer.
```tsx
<DMHeader 
  userName="John Doe"
  userInitial="J"
  avatarUrl="/avatar.jpg"
  status="Online"
  isOnline={true}
/>
```

## 📝 Form Components

### TextInput
Återanvändbar text input.
```tsx
<TextInput 
  label="Kanalnamn"
  value={name}
  onChange={(e) => setName(e.target.value)}
  placeholder="general"
  error={errors.name}
  fullWidth={true}
/>
```

### TextArea
Återanvändbar textarea.
```tsx
<TextArea 
  label="Beskrivning"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  rows={4}
  error={errors.description}
/>
```

### Button
Återanvändbar knapp med varianter.
```tsx
<Button 
  variant="primary"
  size="md"
  fullWidth={false}
  loading={saving}
  onClick={handleSubmit}
>
  Spara
</Button>
```

Varianter: `primary`, `secondary`, `danger`, `ghost`
Storlekar: `sm`, `md`, `lg`

### FormGroup
Grupperar formulärfält med spacing.
```tsx
<FormGroup spacing="md">
  <TextInput label="Namn" />
  <TextInput label="Email" />
  <Button>Spara</Button>
</FormGroup>
```

### SelectInput
Dropdown-meny för val av alternativ.
```tsx
<SelectInput 
  label="Välj roll"
  value={role}
  onChange={setRole}
  options={[
    { value: 'admin', label: 'Admin' },
    { value: 'member', label: 'Medlem' }
  ]}
  placeholder="Välj..."
  error={errors.role}
/>
```

### CheckboxInput
Checkbox med label och beskrivning.
```tsx
<CheckboxInput 
  checked={acceptTerms}
  onChange={setAcceptTerms}
  label="Acceptera villkor"
  description="Jag har läst och accepterar användarvillkoren"
  disabled={false}
/>
```

### FileInputButton
Knapp för filuppladdning.
```tsx
<FileInputButton 
  onFileSelect={handleFileUpload}
  accept="image/*"
  label="Välj bild"
  icon="📁"
  variant="secondary"
  disabled={uploading}
/>
```

### SliderInput
Slider för numeriska värden.
```tsx
<SliderInput 
  value={volume}
  onChange={setVolume}
  min={0}
  max={100}
  step={1}
  label="Volym"
  showValue={true}
/>
```

### ColorPicker
Färgväljare med förvalda färger.
```tsx
<ColorPicker 
  value={color}
  onChange={setColor}
  label="Välj färg"
  presets={['#FF0000', '#00FF00', '#0000FF']}
/>
```

### ResourceForm
Generisk form för att skapa/redigera resurser (channels, workspaces).
```tsx
<ResourceForm 
  fields={[
    { name: 'name', label: 'Namn', type: 'text', required: true, maxLength: 50 },
    { name: 'description', label: 'Beskrivning', type: 'textarea', maxLength: 200 },
    { name: 'iconUrl', label: 'Ikon URL', type: 'url' }
  ]}
  initialValues={{ name: 'general', description: '' }}
  onSubmit={async (vals) => await api.post('/channels', vals)}
  onCancel={handleCancel}
  submitText="Skapa"
  cancelText="Avbryt"
  isLoading={creating}
/>
```

## 🎨 Layout Components

### EmptyState
Visar tom state med ikon och text.
```tsx
<EmptyState 
  icon="📭"
  title="Inga meddelanden"
  description="Börja konversationen genom att skicka ett meddelande!"
  action={<Button>Skicka meddelande</Button>}
/>
```

### Divider
En separator-linje.
```tsx
<Divider orientation="horizontal" spacing="md" />
<Divider orientation="vertical" spacing="sm" />
```

### Flex
Flexible box layout komponent.
```tsx
<Flex direction="row" align="center" justify="between" gap="md" wrap={false}>
  <div>Item 1</div>
  <div>Item 2</div>
</Flex>
```
Props: direction (row/column), align (start/center/end/stretch), justify (start/center/end/between/around), gap (none/sm/md/lg), wrap

### Stack
Vertikal stack layout.
```tsx
<Stack spacing="md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Stack>
```
Spacing: none, sm, md, lg, xl

### Grid
CSS Grid layout komponent.
```tsx
<Grid cols={3} gap="md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Grid>
```
Cols: 1, 2, 3, 4, 6, 12

### Center
Centrera innehåll.
```tsx
<Center axis="both">
  <Spinner />
</Center>
```
Axis: both, horizontal, vertical

### Spacer
Lägg till mellanrum mellan element.
```tsx
<Spacer size="md" axis="vertical" />
```
Size: sm, md, lg, xl; Axis: horizontal, vertical

## 👤 Profile Components

### RoleBadge
Visar användarroll som ett färgkodat badge.
```tsx
<RoleBadge role="OWNER" size="md" />
<RoleBadge role="ADMIN" size="sm" />
<RoleBadge role="MEMBER" size="md" />
```

### ProfileHeader
Avatar med namn, email och roll, inkluderar edit overlay.
```tsx
<ProfileHeader 
  avatarUrl={user.avatarUrl}
  name="John Doe"
  email="john@example.com"
  role="ADMIN"
  isUploading={false}
  onUploadAvatar={handleUpload}
  onRemoveAvatar={handleRemove}
/>
```

### ProfileActions
Knappar för edit, save, cancel, logout och delete.
```tsx
<ProfileActions 
  isEditing={false}
  isSaving={false}
  isCurrentUser={true}
  onEdit={handleEdit}
  onSave={handleSave}
  onCancel={handleCancel}
  onLogout={handleLogout}
  onDelete={handleDelete}
/>
```

### ProfileEditForm
Formulär för att redigera profil (namn, bio).
```tsx
<ProfileEditForm 
  firstName="John"
  lastName="Doe"
  bio="Developer"
  onChange={handleChange}
  disabled={false}
/>
```

### ProfileInfo
Visar profilinfo i läsläge.
```tsx
<ProfileInfo 
  firstName="John"
  lastName="Doe"
  email="john@example.com"
  bio="Developer"
  createdAt="2024-01-01T00:00:00Z"
/>
```

### RoleSelector
Radio-selector för att ändra användarroll (admin).
```tsx
<RoleSelector 
  currentRole="MEMBER"
  canChangeRole={true}
  onChange={handleRoleChange}
  disabled={false}
/>
```

## ⚙️ Settings Components

### ToggleSwitch
iOS-stil toggle switch för boolean-inställningar.
```tsx
<ToggleSwitch 
  checked={enabled}
  onChange={setEnabled}
  size="md"
  disabled={false}
/>
```

### SettingSection
Grupperar relaterade inställningar med rubrik.
```tsx
<SettingSection 
  title="Notifikationer"
  description="Hantera dina notifikations-preferenser"
>
  <SettingItem label="Desktop" />
  <SettingItem label="Ljud" />
</SettingSection>
```

### SettingItem
En enskild inställnings-rad med label och kontroll.
```tsx
<SettingItem 
  label="Desktop-notifikationer"
  description="Få desktop-notiser för nya meddelanden"
>
  <ToggleSwitch checked={enabled} onChange={setEnabled} />
</SettingItem>
```

### RadioOptions
Radio button-grupp med beskrivningar.
```tsx
<RadioOptions 
  options={[
    { value: 'light', label: 'Ljust', description: 'Ljust tema' },
    { value: 'dark', label: 'Mörkt', description: 'Mörkt tema' }
  ]}
  value={theme}
  onChange={setTheme}
/>
```

### SettingsTabButton
Tab-knapp för settings sidebar navigation.
```tsx
<SettingsTabButton 
  label="Utseende"
  active={activeTab === 'appearance'}
  onClick={() => setActiveTab('appearance')}
/>
```

## 👥 Member Components

### StatusIndicator
Visar online/away/busy/offline status dot.
```tsx
<StatusIndicator status="ONLINE" size="sm" />
<StatusIndicator status="AWAY" size="md" />
```

### MemberListHeader
Header med medlemsantal och sökknapp.
```tsx
<MemberListHeader 
  memberCount={42}
  showSearch={false}
  onSearchToggle={() => setShowSearch(!showSearch)}
/>
```

### MemberSearch
Sökinput för filtrering av medlemmar.
```tsx
<MemberSearch 
  value={query}
  onChange={setQuery}
  placeholder="Sök efter namn eller e-post..."
/>
```

### MemberSection
Roll-baserad gruppering med rubrik.
```tsx
<MemberSection title="Administratörer" count={3}>
  <MemberListItem user={user1} />
  <MemberListItem user={user2} />
</MemberSection>
```

### MemberListItem
En användare i listan med avatar, namn, status och DM-knapp.
```tsx
<MemberListItem 
  userId="123"
  avatarUrl={user.avatarUrl}
  displayName="John Doe"
  customStatus="Arbetar"
  status="ONLINE"
  isCurrentUser={false}
  onClick={handleClick}
  onStartDM={handleStartDM}
/>
```

## 🔲 Modal Utility Components

### ImagePreview
Visar förhandsgranskning av uppladdad/angiven bild.
```tsx
<ImagePreview 
  src="https://example.com/image.png"
  alt="Preview"
  size="md"
  rounded="full"
  label="Förhandsgranskning"
/>
```

### LabeledInput
Input-fält med label ovanför.
```tsx
<LabeledInput 
  label="Kanalnamn"
  value={name}
  onChange={setName}
  placeholder="Ange namn"
  required={true}
/>
```

### EmptyMessage
Visar meddelande när inga items hittas.
```tsx
<EmptyMessage 
  message="Inga användare hittades"
  icon={<SearchIcon />}
/>
```

### ResourceDeleteDialog
Generisk delete confirmation dialog för vilken resurs som helst.
```tsx
<ResourceDeleteDialog 
  isOpen={deleteModal.isOpen}
  resourceType="channel"
  resourceName={deleteModal.data?.name ?? ''}
  onConfirm={async () => await deleteChannel(deleteModal.data.id)}
  onClose={deleteModal.close}
  dangerMessage="Detta går inte att ångra!" 
/>
```
Resource types: `channel`, `workspace`, `message`, `user`

## 🎨 Additional UI Components

### Badge
Small label för counts, status eller kategorier.
```tsx
<Badge variant="primary" size="sm">Ny</Badge>
<Badge variant="danger" size="md">3</Badge>
```

### Tooltip
Hover tooltip wrapper.
```tsx
<Tooltip content="Klikka för att redigera" position="top">
  <button>Edit</button>
</Tooltip>
```

### SearchInput
Återanvändbar sökinput med ikon.
```tsx
<SearchInput 
  value={query}
  onChange={setQuery}
  placeholder="Sök..."
/>
```

### CountBadge
Visar numerisk count (t.ex. olästa meddelanden).
```tsx
<CountBadge count={5} variant="danger" max={99} />
<CountBadge count={142} variant="primary" max={99} /> // Shows "99+"
```

### Card
Flexibel card-container med header och footer.
```tsx
<Card 
  header="Titel"
  footer={<Button>Action</Button>}
  padding="md"
>
  Content här
</Card>
```

## 🏢 Workspace Components

### WorkspaceIcon
Visar workspace icon eller initial.
```tsx
<WorkspaceIcon name="Boxflow" iconUrl={url} size="md" />
```

### WorkspaceButton
Klickbar workspace med alla interaktioner.
```tsx
<WorkspaceButton 
  id="123"
  name="Boxflow"
  iconUrl={url}
  isActive={true}
  onClick={handleClick}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### AddButton
Återanvändbar + knapp.
```tsx
<AddButton 
  onClick={handleAdd}
  title="Lägg till workspace"
  variant="workspace"
/>
```

### WorkspaceSidebar
Vertikal workspace lista med alla funktioner.
```tsx
<WorkspaceSidebar 
  workspaces={workspaces}
  currentWorkspaceId={current}
  onSelectWorkspace={handleSelect}
  onAddWorkspace={handleAdd}
  footer={<SettingsButton />}
/>
```

## 👤 User Components

### UserBar
Användarinfo bar med avatar, namn och actions.
```tsx
<UserBar 
  avatarUrl={user.avatar}
  displayName="John Doe"
  subtitle="Admin"
  onProfileClick={handleProfile}
  onLogoutClick={handleLogout}
/>
```

### UserAvatarInfo
Kompakt user info med avatar och badge.
```tsx
<UserAvatarInfo 
  avatarUrl={user.avatar}
  name="John Doe"
  subtitle="Online"
  size="md"
  badge={<StatusIndicator status="ONLINE" />}
  onClick={handleClick}
/>
```

## ⚡ Action Components

### ActionButton
Generisk action knapp med ikon.
```tsx
<ActionButton 
  icon={<EditIcon />}
  label="Redigera"
  onClick={handleEdit}
  variant="primary"
/>
```

### ActionGroup
Gruppera actions med spacing.
```tsx
<ActionGroup orientation="horizontal" spacing="md" align="end">
  <EditButton onClick={handleEdit} />
  <DeleteButton onClick={handleDelete} />
</ActionGroup>
```

### EditButton
Snabb edit action.
```tsx
<EditButton onClick={handleEdit} title="Redigera" />
```

### DeleteButton
Snabb delete action.
```tsx
<DeleteButton onClick={handleDelete} title="Ta bort" />
```

## 🔔 Notification Components

### Toast
Tillfällig notifikation popup.
```tsx
<Toast 
  message="Sparad!"
  variant="success"
  duration={5000}
  onClose={handleClose}
/>
```

### ToastContainer
Hantera flera toasts.
```tsx
<ToastContainer 
  toasts={toastList}
  onRemove={removeToast}
  position="top-right"
/>
```

### AlertBanner
Inline alert/info banner.
```tsx
<AlertBanner 
  message="Viktigt meddelande"
  variant="warning"
  dismissible={true}
  onDismiss={handleDismiss}
/>
```

### SpinnerOverlay
Full screen loading overlay.
```tsx
<SpinnerOverlay message="Laddar..." transparent={true} />
```

## 📋 List Components

### ListContainer
Scrollbar list container.
```tsx
<ListContainer 
  header={<ListHeader title="Items" count={10} />}
  emptyMessage="Inga items"
  maxHeight="400px"
>
  {items.map(item => <ListItem key={item.id} {...item} />)}
</ListContainer>
```

### ListItemWrapper
Generisk list item med hover.
```tsx
<ListItemWrapper 
  onClick={handleClick}
  active={isActive}
  hoverable={true}
>
  Content här
</ListItemWrapper>
```

### ListHeader
List section header.
```tsx
<ListHeader 
  title="Kanaler"
  count={5}
  action={<AddButton onClick={handleAdd} />}
/>
```

## 📦 Container Components

### Panel
Panel container med header/footer.
```tsx
<Panel 
  header={<h2>Titel</h2>}
  footer={<Button>Action</Button>}
>
  Panel content
</Panel>
```

### Section
Content section med titel.
```tsx
<Section 
  title="Inställningar"
  description="Hantera dina inställningar"
  spacing="md"
>
  <SettingItem />
  <SettingItem />
</Section>
```

### SplitView
Two-panel split layout.
```tsx
<SplitView 
  left={<Sidebar />}
  right={<MainContent />}
  leftWidth="300px"
/>
```

## 🖼️ Avatar Components

### AvatarGroup
Visa flera avatars staplade.
```tsx
<AvatarGroup 
  avatars={[
    { src: '/user1.jpg', initial: 'A' },
    { src: '/user2.jpg', initial: 'B' },
    { src: '/user3.jpg', initial: 'C' }
  ]}
  max={3}
  size="md"
/>
```

### AvatarWithStatus
Avatar med status-indikator.
```tsx
<AvatarWithStatus 
  src="/avatar.jpg"
  initial="JS"
  status="ONLINE"
  statusPosition="bottom-right"
/>
```

### AvatarUpload
Avatar med drag-drop uppladdning.
```tsx
<AvatarUpload 
  src={avatarUrl}
  initial="JS"
  onUpload={handleUpload}
  onRemove={handleRemove}
  isUploading={uploading}
/>
```

## 📋 Menu Components

### DropdownMenu
Dropdown-meny med click-outside.
```tsx
<DropdownMenu 
  trigger={<Button>Meny</Button>}
  align="left"
>
  <MenuItem icon="✏️" label="Redigera" onClick={handleEdit} />
  <MenuItem icon="🗑️" label="Ta bort" onClick={handleDelete} variant="danger" />
</DropdownMenu>
```

### MenuItem
Enskilt meny-item.
```tsx
<MenuItem 
  icon="✏️"
  label="Redigera"
  onClick={handleEdit}
  variant="default"
  selected={false}
  disabled={false}
/>
```

### MenuDivider
Separator i menyer.
```tsx
<MenuDivider />
```

### ContextMenu
Högerklicks-meny.
```tsx
<ContextMenu 
  menu={[
    { icon: '✏️', label: 'Redigera', onClick: handleEdit },
    { icon: '🗑️', label: 'Ta bort', onClick: handleDelete, variant: 'danger' }
  ]}
>
  <div>Högerklicka här</div>
</ContextMenu>
```

## 💬 Dialog Components

### ConfirmDialog
Bekräftelse-dialog.
```tsx
<ConfirmDialog 
  isOpen={showConfirm}
  title="Radera kanal?"
  message="Detta går inte att ångra."
  confirmText="Radera"
  cancelText="Avbryt"
  variant="danger"
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
  onClose={() => setShowConfirm(false)}
  isLoading={deleting}
/>
```

### PromptDialog
Input-prompt dialog.
```tsx
<PromptDialog 
  isOpen={showPrompt}
  title="Byt namn"
  message="Ange nytt namn för kanalen"
  placeholder="general"
  defaultValue={currentName}
  confirmText="Spara"
  onConfirm={handleRename}
  onClose={() => setShowPrompt(false)}
/>
```

### DialogHeader
Återanvändbar dialog-header.
```tsx
<DialogHeader 
  title="Inställningar"
  subtitle="Hantera dina preferenser"
  onClose={handleClose}
/>
```

### DialogFooter
Dialog-footer med knappar.
```tsx
<DialogFooter align="right">
  <Button variant="ghost" onClick={handleCancel}>Avbryt</Button>
  <Button variant="primary" onClick={handleSave}>Spara</Button>
</DialogFooter>
```

## 📑 Tabs Components

### Tabs
Tab-navigation med flera varianter.
```tsx
<Tabs 
  tabs={[
    { id: 'profile', label: 'Profil', icon: '👤' },
    { id: 'settings', label: 'Inställningar', icon: '⚙️' },
    { id: 'privacy', label: 'Integritet', icon: '🔒' }
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
  variant="default"
/>
```
Varianter: `default`, `pills`, `underline`

### TabPanel
Tab-innehålls panel.
```tsx
<TabPanel activeTab={activeTab} tabId="profile" keepMounted={false}>
  <ProfileContent />
</TabPanel>
```

## 📜 Scroll Components

### ScrollToBottomButton
Knapp för att scrolla till botten.
```tsx
<ScrollToBottomButton 
  onClick={scrollToBottom}
  visible={showScrollButton}
  unreadCount={5}
/>
```

### ScrollArea
Scrollbar-område med auto-scroll.
```tsx
<ScrollArea 
  autoScroll={true}
  maxHeight="500px"
  onScroll={handleScroll}
>
  {messages.map(msg => <Message key={msg.id} {...msg} />)}
</ScrollArea>
```

## 🔧 Utility Components

### Timestamp
Formatera timestamps.
```tsx
<Timestamp 
  date={message.createdAt}
  format="relative"
/>
```
Format: `relative` (5m sedan), `short` (13:45), `long` (2024-01-15 13:45), `time` (13:45:30)

### Skeleton
Loading placeholder.
```tsx
<Skeleton 
  variant="text"
  width="200px"
  height="20px"
/>
```
Varianter: `text`, `circular`, `rectangular`

### ProgressBar
Progress-indikator.
```tsx
<ProgressBar 
  value={uploadProgress}
  max={100}
  showLabel={true}
  variant="primary"
  size="md"
/>
```

## 🎯 Fördelar med denna struktur

1. **DRY-princip** - Ändra på ett ställe → Uppdateras överallt
2. **Små komponenter** - Lättare att förstå och underhålla
3. **Återanvändbara** - Använd samma komponent i flera sammanhang
4. **Testbara** - Varje komponent kan testas separat
5. **Type-safe** - TypeScript typer genom hela projektet
6. **Konsekvent design** - Alla komponenter följer samma mönster

## 🪝 Custom Hooks

### useFormState
Återanvändbar form state management.
```tsx
const { values, errors, setValue, handleSubmit } = useFormState({
  initialValues: { name: '', email: '' },
  validate: (vals) => {
    const errs = {};
    if (!vals.name) errs.name = 'Required';
    return errs;
  },
  onSubmit: async (vals) => {
    await api.post('/users', vals);
  }
});
```

### useModalState
Modal state management med callbacks.
```tsx
const modal = useModalState({
  onOpen: () => console.log('opened'),
  onClose: () => console.log('closed')
});

// Usage: modal.isOpen, modal.open(), modal.close()
```

### useModalWithData
Modal med data (för edit/delete).
```tsx
const deleteModal = useModalWithData<{ id: string; name: string }>();

// Open with data
deleteModal.open({ id: '123', name: 'Test' });

// Access data
if (deleteModal.isOpen) {
  console.log(deleteModal.data);
}
```

### useAppNavigation
Type-safe navigation.
```tsx
const { goToChannel, goToDM, goToHome } = useAppNavigation();

goToChannel('channel-123');
goToDM('dm-456');
```

### useTypingIndicator
Typing indicator management.
```tsx
const { startTyping, stopTyping } = useTypingIndicator({
  onStartTyping: () => socket.emit('typing', channelId),
  onStopTyping: () => socket.emit('stop-typing', channelId),
  timeout: 3000
});

// Call startTyping() on input change
```

### useAutoScroll
Auto-scroll när dependencies ändras.
```tsx
const scrollRef = useAutoScroll({
  dependencies: [messages.length],
  behavior: 'smooth',
  enabled: true
});

// Attach to element
<div ref={scrollRef} />
```

## 📦 Import

Du kan importera komponenter på två sätt:

```tsx
// Från central export
import { Button, TextInput, MessageAvatar } from '../components';

// Från specifik mapp
import { Button } from '../components/form';
import { MessageAvatar } from '../components/message';
```

## 🔄 Nästa steg

1. Integrera Profile-komponenter i ProfileModal (~462L → ~150L)
2. Integrera Settings-komponenter i SettingsModal (~312L → ~150L)
3. Integrera Member-komponenter i MemberList (~249L → ~120L)
4. Uppdatera ChannelView att använda ChannelHeader, MessageList, MessageInput
5. Uppdatera Sidebar att använda WorkspaceList, ChannelListItem, SectionHeader
6. Uppdatera DMView att använda DMHeader, MessageList, MessageInput
7. Uppdatera modaler att använda LabeledInput, ImagePreview
8. Ta bort duplikerad kod från gamla komponenter

## 📊 Statistik

**Total nya komponenter:** 68+

**Kategorivis:**
- Message: 6 komponenter
- Channel: 4 komponenter
- Sidebar: 4 komponenter
- DM: 2 komponenter
- Form: 4 komponenter
- Layout: 2 komponenter
- Profile: 6 komponenter
- Settings: 5 komponenter
- Member: 5 komponenter
- Modal: 3 komponenter
- **Workspace: 4 komponenter** ✨
- **User: 2 komponenter** ✨
- **Action: 4 komponenter** ✨
- **Notification: 4 komponenter** ✨
- **List: 3 komponenter** ✨
- **Container: 3 komponenter** ✨
- UI: 9+ komponenter

**Förväntad reduktion i kod:**
- ProfileModal: 462L → ~150L (-67%)
- SettingsModal: 312L → ~150L (-52%)
- MemberList: 249L → ~120L (-52%)
- Sidebar: 487L → ~200L (-59%)  ← Nu med WorkspaceSidebar!
- ChannelView: 490L → ~250L (-49%)
- DMView: 317L → ~200L (-37%)

**Total förväntad besparing:** ~1,200+ rader duplicerad kod!

**Nya möjligheter:**
- Workspace management super enkelt
- Konsekvent user display överallt
- Reusable actions för edit/delete
- Toast notifications för feedback
- Flexibla list layouts
- Container patterns för layout consistency
- Layout: 2 komponenter
- Profile: 6 komponenter
- Settings: 5 komponenter
- Member: 5 komponenter
- Modal: 3 komponenter
- UI: 9+ nya komponenter

**Förväntad reduktion i kod:**
- ProfileModal: 462L → ~150L (-67%)
- SettingsModal: 312L → ~150L (-52%)
- MemberList: 249L → ~120L (-52%)
- ChannelView: 490L → ~250L (-49%)
- Sidebar: 487L → ~200L (-59%)
- DMView: 317L → ~200L (-37%)

**Total förväntad besparing:** ~1,000+ rader duplicerad kod!
