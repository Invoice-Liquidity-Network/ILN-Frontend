"use client";

import { useEffect, useMemo } from "react";
import { useNotification } from "@/context/NotificationContext";

const BASE_TITLE = "Invoice Liquidity Network";
const SUFFIX = " | ILN";

interface UseDocumentTitleOptions {
  pageTitle?: string;
}

export function useDocumentTitle({ pageTitle }: UseDocumentTitleOptions = {}) {
  const { unreadCount } = useNotification();

  const formattedTitle = useMemo(() => {
    const normalizedTitle = (pageTitle || BASE_TITLE).replace(/\s*(?:\||·)\s*ILN\s*$/i, "").trim();
    const base = `${normalizedTitle}${SUFFIX}`;

    if (unreadCount > 0) {
      return `(${unreadCount}) ${base}`;
    }

    return base;
  }, [unreadCount, pageTitle]);

  useEffect(() => {
    document.title = formattedTitle;
  }, [formattedTitle]);
}
