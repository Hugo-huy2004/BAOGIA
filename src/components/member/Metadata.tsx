import React from 'react'
import { Helmet } from 'react-helmet-async'

interface MetadataProps {
  title?: string
  description?: string
  keywords?: string[],
  openGraph?: {
    title?: string
    description?: string
    image?: string
    url?: string
  }
}

const Metadata = ({ title, description, keywords, openGraph }: MetadataProps) => {
  return (
    <div>
      <Helmet>
        {title && <title>{title}</title>}
        {description && <meta name="description" content={description} />}
        {keywords && keywords.length > 0 && (
          <meta name="keywords" content={keywords.join(', ')} />
        )}
        {openGraph && (
          <>
            {openGraph.title && <meta property="og:title" content={openGraph.title} />}
            {openGraph.description && <meta property="og:description" content={openGraph.description} />}
            {openGraph.image && <meta property="og:image" content={openGraph.image} />}
            {openGraph.url && <meta property="og:url" content={openGraph.url} />}
          </>
        )}
      </Helmet>
    </div>
  )
}

export default Metadata