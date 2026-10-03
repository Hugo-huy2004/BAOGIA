import React, { Children, isValidElement, cloneElement } from 'react';

/**
 * SwiftUISection - Nhóm Inset Grouped Section theo phong cách iOS Settings / Form (@expo/ui/swift-ui)
 */
export default function SwiftUISection({
  title,
  footer,
  children,
  className = '',
  ...props
}) {
  const childArray = Children.toArray(children).filter(Boolean);

  return (
    <section className={`my-2.5 sm:my-4 ${className}`} {...props}>
      {title && (
        <div className="px-3 sm:px-4 pb-1.5 sm:pb-2 text-xs sm:text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/80 select-none">
          {title}
        </div>
      )}

      <div className="swiftui-grouped-card">
        {childArray.map((child, index) => {
          const isLast = index === childArray.length - 1;
          return (
            <React.Fragment key={index}>
              {isValidElement(child)
                ? cloneElement(child, { _isInsideSection: true })
                : child}
              {!isLast && <div className="swiftui-divider" />}
            </React.Fragment>
          );
        })}
      </div>

      {footer && (
        <div className="px-4 pt-2 text-[13px] text-muted-foreground/75 leading-relaxed">
          {footer}
        </div>
      )}
    </section>
  );
}
