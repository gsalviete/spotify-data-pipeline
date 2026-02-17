import { motion } from 'framer-motion';
import type { SpotifyArtist } from '../types/spotify';
import './TopArtists.css';

interface Props {
  artists: SpotifyArtist[];
}

export default function TopArtists({ artists }: Props) {
  const top10 = artists.slice(0, 10);

  return (
    <div className="top-artists">
      <div className="top-artists-grid">
        {top10.map((artist, index) => (
          <motion.a
            key={artist.id}
            href={artist.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="artist-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.4 }}
            whileHover={{ y: -3 }}
            title={`Popularidade: ${artist.popularity}`}
          >
            <div className="artist-rank">#{index + 1}</div>
            <div className="artist-img-wrapper">
              {artist.images[0] ? (
                <img src={artist.images[0].url} alt={artist.name} className="artist-img" />
              ) : (
                <div className="artist-img artist-img--placeholder" />
              )}
            </div>
            <div className="artist-info">
              <span className="artist-name">{artist.name}</span>
              <span className="artist-genres">
                {artist.genres.slice(0, 2).join(' · ')}
              </span>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
