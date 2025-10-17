import classNames from "classnames";
import {appearanceSystemFont, useAppearance} from "./controls/Appearance";
import {
    DrawerContents,
    DrawerHeader,
    DrawerList,
    DrawerLoading,
} from "./controls/Drawer";
import {
    APPS_INDEX,
    ARCHITECTURE_INDEX,
    CATEGORIES_INDEX,
    createSearchPredicate,
    GAMES_INDEX,
    type LibraryDetailsItem,
    PERSPECTIVE_INDEX,
    SYSTEM_INDEX,
    useLibraryItemDetails,
    type LibraryIndexItem,
} from "./library";
import {downloadUrl, manualUrl} from "./library-urls";
import "./MacLibraryContents.css";
import {memo, type ReactNode, useCallback, useMemo} from "react";
import {Button} from "./controls/Button";
import {MacLibraryHeader} from "./MacLibrary";
import {MacLibraryScreenshots} from "./MacLibraryScreenshots";
import {BevelButton} from "./controls/BevelButton";
import {Group} from "./controls/Group";

export default function MacLibraryContents({
    search,
    setSearch,
    detailsItem,
    setDetailsItem,
    onRun,
}: {
    search: string;
    setSearch: (search: string) => void;
    detailsItem: LibraryIndexItem | undefined;
    setDetailsItem: (item: LibraryIndexItem | undefined) => void;
    onRun: OnRunFn;
}) {
    return (
        <DrawerContents tall>
            {detailsItem ? (
                <MacLibraryItemDetails
                    item={detailsItem}
                    onRun={onRun}
                    onBack={() => setDetailsItem(undefined)}
                />
            ) : (
                <MacLibraryBrowser
                    search={search}
                    setSearch={setSearch}
                    onSelectItem={setDetailsItem}
                />
            )}
        </DrawerContents>
    );
}

function MacLibraryBrowser({
    search,
    setSearch,
    onSelectItem,
}: {
    search: string;
    setSearch: (search: string) => void;
    onSelectItem: OnSelectItemFn;
}) {
    const [games, apps] = useMemo(() => {
        if (!search) {
            return [GAMES_INDEX, APPS_INDEX];
        }
        const searchPredicate = createSearchPredicate(search);
        return [
            GAMES_INDEX.filter(searchPredicate),
            APPS_INDEX.filter(searchPredicate),
        ];
    }, [search]);

    return (
        <>
            <MacLibraryHeader search={search} setSearch={setSearch} />
            <DrawerList tall>
                {games.length > 0 && (
                    <MacLibraryTable
                        title="Game"
                        items={games}
                        onSelectItem={onSelectItem}
                    />
                )}
                {apps.length > 0 && (
                    <MacLibraryTable
                        title="Application"
                        items={apps}
                        onSelectItem={onSelectItem}
                    />
                )}
                {apps.length === 0 && games.length === 0 && (
                    <div className="Drawer-Loading">No items match!</div>
                )}
            </DrawerList>
        </>
    );
}

function MacLibraryItemDetails({
    item,
    onRun,
    onBack,
}: {
    item: LibraryIndexItem;
    onRun: OnRunFn;
    onBack: () => void;
}) {
    const appearance = useAppearance();
    const details = useLibraryItemDetails(item);
    const setDescription = useCallback(
        (node: HTMLDivElement | null) => {
            if (!node) {
                return;
            }

            while (node.firstChild) {
                node.firstChild.remove();
            }

            if (!details?.description) {
                return;
            }
            // Minimal attempt at avoiding XSS
            const descriptionNode = new DOMParser().parseFromString(
                details.description,
                "text/html"
            ).body;

            // Make sure relative URLs in the description are pointed at the Garden
            for (const linkNode of descriptionNode.querySelectorAll("a")) {
                const href = linkNode.getAttribute("href");
                if (href) {
                    try {
                        linkNode.href = new URL(
                            href,
                            "https://macintoshgarden.org"
                        ).href;
                    } catch (err) {
                        // Ignore
                    }
                }
            }
            while (descriptionNode.firstChild) {
                node.appendChild(descriptionNode.firstChild);
            }
        },
        [details?.description]
    );

    let contents;
    if (details) {
        const detailRows: ReactNode[] = [];
        const addDetailRow = (label: string, value: ReactNode) => {
            detailRows.push(
                <tr key={detailRows.length}>
                    <th>{label}:</th>
                    <td>{value}</td>
                </tr>
            );
        };

        if (item.year) {
            addDetailRow("Year", item.year);
        }
        addDetailRow(
            item.categories.length > 1 ? "Categories" : "Category",
            item.categories.map(c => CATEGORIES_INDEX[c]).join(", ")
        );
        if (item.perspectives.length) {
            addDetailRow(
                "Perspective",
                item.perspectives.map(c => PERSPECTIVE_INDEX[c]).join(" ")
            );
        }
        if (item.authors.length) {
            addDetailRow("Author", item.authors.join(" "));
        }
        if (item.publishers.length) {
            addDetailRow("Publisher", item.publishers.join(" "));
        }
        if (details.composers.length) {
            addDetailRow("Composers", details.composers.join(" "));
        }
        if (item.systems.length) {
            addDetailRow(
                "Systems",
                item.systems.map(s => SYSTEM_INDEX[s]).join(" ")
            );
        }
        if (item.architectures.length) {
            addDetailRow(
                "Architectures",
                item.architectures.map(a => ARCHITECTURE_INDEX[a]).join(" ")
            );
        }
        if (Object.keys(details.manuals).length) {
            addDetailRow(
                "Manuals",
                <>
                    {Object.entries(details.manuals).map(([file, size]) => (
                        <div key={file}>
                            <a
                                key={file}
                                href={manualUrl(file)}
                                target="_blank">
                                {file}
                            </a>{" "}
                            <span className="size">({formatSize(size)})</span>
                        </div>
                    ))}
                </>
            );
        }
        addDetailRow(
            "Links",
            <>
                <a
                    href={`https://macintoshgarden.org/${details.url}`}
                    target="_blank">
                    Macintosh Garden
                </a>
                {details.externalDownloadUrl && (
                    <>
                        {" · "}
                        <a href={details.externalDownloadUrl} target="_blank">
                            External Download
                        </a>
                    </>
                )}
            </>
        );

        contents = (
            <div
                className={classNames(
                    "Mac-Library-Item-Details",
                    `Mac-Library-Item-Details-${appearance}`
                )}>
                <div className="Mac-Library-Item-Details-Column">
                    {details.screenshots.length > 0 && (
                        <Group label="Screenshots">
                            <MacLibraryScreenshots
                                item={item}
                                details={details}
                            />
                        </Group>
                    )}
                    <MacLibraryItemDownloads
                        item={item}
                        details={details}
                        onRun={onRun}
                    />
                </div>
                <div className="Mac-Library-Item-Details-Column">
                    <Group label="Info">
                        <table className="Mac-Library-Item-Details-Table">
                            <tbody>{detailRows}</tbody>
                        </table>
                    </Group>
                    {details.description && (
                        <Group label="Description">
                            <div
                                className="Mac-Library-Item-Details-Description"
                                ref={setDescription}
                            />
                        </Group>
                    )}
                </div>
            </div>
        );
    } else {
        contents = <DrawerLoading />;
    }

    return (
        <>
            <DrawerHeader>
                <Button onClick={onBack}>‹ Back</Button>
                <div
                    className={classNames(
                        appearanceSystemFont(appearance),
                        "Mac-Library-Item-Details-Title"
                    )}>
                    {item.title}
                </div>
            </DrawerHeader>
            {contents}
        </>
    );
}

function MacLibraryItemDownloads({
    item,
    details,
    onRun,
}: {
    item: LibraryIndexItem;
    details: LibraryDetailsItem;
    onRun: OnRunFn;
}) {
    return (
        <Group label="Downloads" className="Mac-Library-Item-Details-Downloads">
            <ol>
                {Object.entries(details.files).map(([file, size]) => {
                    const url = downloadUrl(file, item.type);
                    let shareUrl = window.location.href;
                    shareUrl += window.location.search ? "&" : "?";
                    shareUrl += `library_url=${encodeURIComponent(url)}`;
                    return (
                        <li key={file}>
                            <a
                                href={shareUrl}
                                onClick={e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onRun(url, item.title, file, size);
                                }}
                                target="_blank">
                                {file}
                            </a>{" "}
                            <span className="size">({formatSize(size)})</span>
                        </li>
                    );
                })}
            </ol>
        </Group>
    );
}

type OnRunFn = (
    url: string,
    name?: string,
    fileName?: string,
    size?: number
) => void;
type OnSelectItemFn = (item: LibraryIndexItem) => void;

const MacLibraryTable = memo(function ({
    title,
    items,
    onSelectItem,
}: {
    title: string;
    items: LibraryIndexItem[];
    onSelectItem: OnSelectItemFn;
}) {
    const appearance = useAppearance();
    let truncationCount = 0;
    if (items.length > 1000) {
        truncationCount = items.length - 1000;
        items = items.slice(0, 1000);
    }

    const header = (
        label: string,
        {
            selected,
            narrow,
            wide,
        }: {selected?: boolean; narrow?: boolean; wide?: boolean} = {}
    ) => {
        const content =
            appearance === "Platinum" ? (
                <BevelButton selected={selected} centered={false}>
                    {label}
                </BevelButton>
            ) : (
                label
            );
        return (
            <th
                className={classNames({
                    "selected": selected,
                    "narrow": narrow,
                    "wide": wide,
                })}>
                {content}
            </th>
        );
    };

    return (
        <table
            className={classNames(
                "Mac-Library-Table",
                `Mac-Library-Table-${appearance}`
            )}>
            <thead>
                <tr>
                    {header(title, {selected: true, wide: true})}
                    {header("Year", {narrow: true})}
                    {header("Category")}
                    {header("Author")}
                </tr>
            </thead>
            <tbody>
                {items.map(item => (
                    <MacLibraryTableRow
                        key={item.id}
                        item={item}
                        onSelectItem={onSelectItem}
                    />
                ))}
            </tbody>
            {truncationCount > 0 && (
                <tfoot>
                    <tr>
                        <td colSpan={4} className="Mac-Library-Table-Footer">
                            (...and {truncationCount} more)
                        </td>
                    </tr>
                </tfoot>
            )}
        </table>
    );
});

const MacLibraryTableRow = memo(function ({
    item,
    onSelectItem,
}: {
    item: LibraryIndexItem;
    onSelectItem: OnSelectItemFn;
}) {
    return (
        <tr onClick={() => onSelectItem(item)}>
            <td className="selected">{item.title}</td>
            <td>{item.year ?? "-"}</td>
            <td>{item.categories.map(c => CATEGORIES_INDEX[c]).join(", ")}</td>
            <td>{item.authors.join(" ")}</td>
        </tr>
    );
});

function formatSize(size: number): string {
    if (size < 1024) {
        return `${size.toLocaleString()}B`;
    }
    if (size < 1024 * 1024) {
        return `${Math.round(size / 1024).toLocaleString()}KB`;
    }
    if (size < 1024 * 1024 * 1024) {
        return `${(size / 1024 / 1024).toLocaleString(undefined, {
            maximumFractionDigits: 1,
        })}MB`;
    }
    return `${(size / 1024 / 1024 / 1024).toLocaleString(undefined, {
        maximumFractionDigits: 2,
    })}GB`;
}
