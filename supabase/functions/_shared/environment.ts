export function prdUrl(ref: string, actual: string) {
  if(!/^[a-z]{20}$/.test(ref)||ref==='ufeahglxwygvlugfsopi'||ref==='pppppppppppppppppppp'||actual!==`https://${ref}.supabase.co`) throw new Error('PRD environment mismatch');
  return actual;
}
